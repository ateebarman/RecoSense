#!/usr/bin/env python3
"""Train a LightFM model and dump top-N recommendations per user to a JSON file.

Requirements: lightfm, pandas, scipy, pymongo, python-dotenv
"""
import os
import json
from pathlib import Path
from dotenv import load_dotenv
import argparse
import pandas as pd
import numpy as np
from scipy.sparse import coo_matrix
try:
    from lightfm import LightFM
    HAVE_LIGHTFM = True
except Exception:
    HAVE_LIGHTFM = False
from pymongo import MongoClient


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'data'
OUT_FILE = DATA_DIR / 'lightfm_recs.json'


def load_reviews(file_path):
    try:
        return pd.read_json(file_path)
    except Exception:
        # fallback for jsonlines
        rows = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    # best-effort
                    pass
        return pd.DataFrame(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--infer-only', action='store_true', help='Skip heavy training and only run inference/generation (popularity-based fallback)')
    args = parser.parse_args()
    infer_only = args.infer_only
    load_dotenv()
    mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        print('MONGO_URI not set; aborting')
        return

    reviews_path = DATA_DIR / 'filtered_smartphone_reviews.json'
    if not reviews_path.exists():
        print('Reviews file not found:', reviews_path)
        return

    print('Loading reviews...')
    reviews = load_reviews(reviews_path)
    if reviews.empty:
        print('No reviews found; aborting')
        return

    # Keep user_id and asin and rating
    interactions = reviews[['user_id', 'asin']].copy()
    if 'overall' in reviews.columns:
        interactions['rating'] = reviews['overall'].fillna(1.0)
    elif 'rating' in reviews.columns:
        interactions['rating'] = reviews['rating'].fillna(1.0)
    else:
        interactions['rating'] = 1.0

    # Connect to Mongo to pull user likedProducts
    client = MongoClient(mongo_uri)
    users = []
    try:
        db_name = os.environ.get('MONGO_DB')
        if db_name:
            db = client[db_name]
        else:
            try:
                db = client.get_default_database()
            except Exception:
                # try to pick a sensible DB name from the server
                dbs = [d for d in client.list_database_names() if d not in ('admin', 'local', 'config')]
                if len(dbs) > 0:
                    db = client[dbs[0]]
                else:
                    db = None
        if db is not None:
            users = list(db.get_collection('users').find({}, {'user_id': 1, 'likedProducts': 1}))
        else:
            print('Warning: no accessible database found; proceeding without likes.')
    except Exception as e:
        print('Warning: could not read users from MongoDB, proceeding without likes.', e)
    likes_rows = []
    for u in users:
        uid = u.get('user_id')
        for asin in u.get('likedProducts', []):
            likes_rows.append({'user_id': uid, 'asin': asin, 'rating': 4.0})

    likes_df = pd.DataFrame(likes_rows)
    if not likes_df.empty:
        interactions = pd.concat([interactions, likes_df], ignore_index=True)

    # build index maps
    user_ids = interactions['user_id'].astype(str).unique()
    item_ids = interactions['asin'].astype(str).unique()
    user_map = {u: i for i, u in enumerate(user_ids)}
    item_map = {it: j for j, it in enumerate(item_ids)}

    rows = interactions['user_id'].map(user_map).to_numpy()
    cols = interactions['asin'].map(item_map).to_numpy()
    data = interactions['rating'].to_numpy()

    mat = coo_matrix((data, (rows, cols)), shape=(len(user_ids), len(item_ids)))

    # build metadata lookup
    metadata_path = DATA_DIR / 'filtered_smartphone_metadata.json'
    meta = {}
    if metadata_path.exists():
        md = pd.read_json(metadata_path)
        for _, r in md.iterrows():
            meta_key = r.get('parent_asin') or r.get('asin')
            if meta_key:
                meta[str(meta_key)] = {
                    'title': r.get('title'),
                    'price': r.get('price'),
                    'category': r.get('main_category'),
                    'images': r.get('imageURLHighRes') or r.get('images') or []
                }

    # --- ABSA FEATURE INJECTION RE-ENABLED (DEBUG) ---
    absa_path = DATA_DIR / 'absa_reviews.json'
    item_features = None
    if absa_path.exists() and HAVE_LIGHTFM:
        print('Loading ABSA scores for item features...')
        try:
            # Load ABSA data
            absa_df = load_reviews(absa_path)
            
            # Find all _score columns
            score_cols = [c for c in absa_df.columns if c.endswith('_score')]
            
            if score_cols:
                # Group by ASIN and take mean sentiment for each aspect
                item_absa = absa_df.groupby('asin')[score_cols].mean()
                
                # Align with our current item_ids
                # We only take asins that exist in our main interactions
                existing_item_ids = [it for it in item_ids if it in item_absa.index]
                
                if existing_item_ids:
                    from scipy.sparse import csr_matrix
                    
                    # Create the feature matrix for items we have ABSA data for
                    # For items without ABSA data, we use 0.0 (neutral)
                    feature_data = item_absa.reindex(item_ids).fillna(0.0).to_numpy()
                    item_features = csr_matrix(feature_data) 
                    
                    print(f'Integrated {len(score_cols)} ABSA aspects into {len(item_ids)} items.')
        except Exception as e:
            print(f'Soft-failed to load ABSA features: {e}. Proceeding with collaborative only.')
    # --- ABSA FEATURE INJECTION END ---

    # If --infer-only specified, or LightFM isn't available, generate high-quality personalized fallbacks
    if infer_only or not HAVE_LIGHTFM:
        if infer_only:
            print('Infer-only mode: using ABSA similarity for recommendations')
        else:
            print('LightFM not available; using Content-Aware Sensitivity Fallback (ABSA Similarity)')
        
        # Calculate item similarity matrix based on ABSA scores
        # This replaces the neural collaborative layer with a semantic content layer
        counts = interactions['asin'].value_counts()
        
        # 1. Get average ABSA features for the whole catalog
        from sklearn.metrics.pairwise import cosine_similarity
        
        # We need the score columns indices again
        absa_df = load_reviews(absa_path)
        score_cols = [c for c in absa_df.columns if c.endswith('_score')]
        catalog_features = absa_df.groupby('asin')[score_cols].mean().reindex(item_ids).fillna(0.0)
        
        recs = {}
        n_rec = 20
        
        for u in user_ids:
            # Get user's liked ASINs
            user_likes = interactions[interactions['user_id'] == u]['asin'].astype(str).tolist()
            user_likes_set = set(user_likes)
            
            # If user has no likes, give them weighted popularity (Cold Start)
            if not user_likes:
                out = []
                rank = 1
                for asin in counts.index:
                    if rank > n_rec: break
                    entry = {'rank': rank, 'asin': asin, 'score': float(counts.get(asin, 0))}
                    if asin in meta: entry.update(meta[asin])
                    out.append(entry)
                    rank += 1
                recs[u] = out
                continue

            # 2. Personalized Content Recommendation: Calculate User's "Taste Profile"
            # Get features of items the user actually liked
            liked_features = catalog_features.loc[catalog_features.index.isin(user_likes)]
            if liked_features.empty:
                # Fallback to general popularity if their likes have no ABSA data
                user_profile = np.zeros((1, len(score_cols)))
            else:
                user_profile = liked_features.mean().values.reshape(1, -1)
            
            # 3. Calculate similarity between User Profile and all Catalog Items
            sim_scores = cosine_similarity(user_profile, catalog_features.values).flatten()
            
            # 4. Filter and Rank
            # We want high similarity + a small boost for the item's general popularity
            # Score = (Similarity * 10) + log1p(count)
            rank_scores = []
            for idx, asin in enumerate(item_ids):
                if asin in user_likes_set: continue
                s = (sim_scores[idx] * 10) + np.log1p(counts.get(asin, 0))
                rank_scores.append((asin, s))
            
            rank_scores.sort(key=lambda x: x[1], reverse=True)
            
            out = []
            for rank, (asin, score) in enumerate(rank_scores[:n_rec], 1):
                entry = {'rank': rank, 'asin': asin, 'score': float(score)}
                if asin in meta: entry.update(meta[asin])
                out.append(entry)
            recs[u] = out
    else:
        print('Training hybrid LightFM model...')
        model = LightFM(loss='warp', no_components=30)
        # Using num_threads=1 because Windows build lacks OpenMP
        model.fit(mat, item_features=item_features, epochs=20, num_threads=1)
        
        print('Generating recommendations...')
        recs = {}
        n_rec = 20
        # For prediction, we must pass the same item_features
        for u, ui in user_map.items():
            scores = model.predict(ui, np.arange(len(item_ids)), item_features=item_features)
            # sort items by score, exclude those present in interactions
            seen = set(interactions[interactions['user_id'] == u]['asin'].astype(str).tolist())
            order = np.argsort(-scores)
            out = []
            rank = 1
            for idx in order:
                asin = item_ids[idx]
                if asin in seen:
                    continue
                entry = {'rank': rank, 'asin': asin, 'score': float(scores[idx])}
                if asin in meta:
                    entry.update(meta[asin])
                out.append(entry)
                rank += 1
                if rank > n_rec:
                    break
            recs[u] = out

    print('Writing recommendations to', OUT_FILE)
    try:
        OUT_FILE.write_text(json.dumps(recs, ensure_ascii=False, indent=2))
        print(f'Wrote {len(recs)} users')
    except Exception as e:
        print('Error writing recommendations file:', e)
    print('Done')


if __name__ == '__main__':
    main()
