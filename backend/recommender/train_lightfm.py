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
                    'images': r.get('images', [])
                }

    # If --infer-only specified, or LightFM isn't available, generate popularity-based recommendations only
    if infer_only or not HAVE_LIGHTFM:
        if infer_only:
            print('Infer-only mode: skipping training, generating popularity-based recommendations')
        else:
            print('LightFM not available; falling back to popularity-based per-user recommendations')
        counts = interactions['asin'].value_counts()
        popular_asins = counts.index.tolist()
        recs = {}
        n_rec = 20
        for u in user_ids:
            seen = set(interactions[interactions['user_id'] == u]['asin'].astype(str).tolist())
            out = []
            rank = 1
            for asin in popular_asins:
                if asin in seen:
                    continue
                entry = {'rank': rank, 'asin': asin, 'score': float(counts.get(asin, 0))}
                if asin in meta:
                    entry.update(meta[asin])
                out.append(entry)
                rank += 1
                if rank > n_rec:
                    break
            recs[u] = out
    else:
        print('Training LightFM model...')
        model = LightFM(loss='warp')
        model.fit(mat, epochs=10, num_threads=4)
        print('Generating recommendations...')
        # collaborative model predictions
        recs = {}
        n_rec = 20
        for u, ui in user_map.items():
            scores = model.predict(ui, np.arange(len(item_ids)))
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
    # recs already computed by model or fallback above

    print('Writing recommendations to', OUT_FILE)
    try:
        OUT_FILE.write_text(json.dumps(recs, ensure_ascii=False, indent=2))
        print(f'Wrote {len(recs)} users')
    except Exception as e:
        print('Error writing recommendations file:', e)
    print('Done')


if __name__ == '__main__':
    main()
