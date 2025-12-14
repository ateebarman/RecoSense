import pandas as pd
import numpy as np
import json
import re
from tqdm import tqdm

def recommend_products(user_id, reviews_file="absa_reviews.json", metadata_file="metadata.jsonl", top_n=10):
    print(f"Loading review data from {reviews_file}...")
    reviews_data = []
    with open(reviews_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                review = json.loads(line.strip())
                reviews_data.append(review)
            except json.JSONDecodeError:
                match = re.search(r'(\{.*\})', line)
                if match:
                    try:
                        review = json.loads(match.group(1))
                        reviews_data.append(review)
                    except:
                        pass

    print(f"Loaded {len(reviews_data)} reviews")
    reviews_df = pd.DataFrame(reviews_data)
    aspect_cols = [col for col in reviews_df.columns if '_score' in col]
    print(f"Found {len(aspect_cols)} aspect columns: {aspect_cols}")
    if not aspect_cols:
        print("No aspect score columns found in the reviews data!")
        return []

    print(f"Loading product metadata from {metadata_file}...")
    metadata_data = []
    with open(metadata_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                metadata = json.loads(line.strip())
                metadata_data.append(metadata)
            except:
                pass
    metadata_df = pd.DataFrame(metadata_data)
    print(f"Loaded metadata for {len(metadata_df)} products")

    if user_id not in reviews_df['user_id'].values:
        print(f"User {user_id} not found in the dataset")
        return []

    user_reviews = reviews_df[reviews_df['user_id'] == user_id]
    print(f"Found {len(user_reviews)} reviews by user {user_id}")
    user_aspect_profile = user_reviews[aspect_cols].mean()
    user_items = set(user_reviews['asin'].values)
    candidate_items = [asin for asin in reviews_df['asin'].unique() if asin not in user_items]
    print(f"Found {len(candidate_items)} candidate items for recommendations")

    print("Calculating recommendation scores...")
    item_scores = []
    for asin in tqdm(candidate_items):
        item_reviews = reviews_df[reviews_df['asin'] == asin]
        if item_reviews.empty:
            continue
        item_aspect_profile = item_reviews[aspect_cols].mean()
        dot_product = np.dot(user_aspect_profile, item_aspect_profile)
        user_norm = np.linalg.norm(user_aspect_profile)
        item_norm = np.linalg.norm(item_aspect_profile)
        if user_norm == 0 or item_norm == 0:
            similarity = 0
        else:
            similarity = dot_product / (user_norm * item_norm)
        avg_rating = item_reviews['rating'].mean() if 'rating' in item_reviews.columns else 0
        pop_factor = np.log1p(len(item_reviews)) / 10
        combined_score = 0.7 * similarity + 0.2 * (avg_rating / 5.0) + 0.1 * pop_factor + 0.2
        item_scores.append((asin, float(combined_score), float(similarity),
                           item_aspect_profile.nlargest(3).index.tolist()))

    item_scores.sort(key=lambda x: x[1], reverse=True)
    recommendations = []
    user_top_aspects = reviews_df[aspect_cols].mean().nlargest(3).index.tolist()
    user_top_aspect_names = [aspect.replace('_score', '') for aspect in user_top_aspects]
    for i, (asin, score, similarity, top_aspects) in enumerate(item_scores[:top_n]):
        rec = {
            "asin": asin,
            "score": score,
            "similarity": similarity,
            "top_aspects": [aspect.replace('_score', '') for aspect in top_aspects]
        }
        meta = metadata_df[metadata_df['parent_asin'] == asin]
        if meta.empty:
            meta = metadata_df[metadata_df.get('asin', '') == asin]
        if not meta.empty:
            rec["title"] = meta.iloc[0].get('title', 'Unknown Title')
            rec["price"] = meta.iloc[0].get('price', 'N/A')
            rec["category"] = meta.iloc[0].get('main_category', '')
            rec["avg_rating"] = meta.iloc[0].get('average_rating', 0)
        recommendations.append(rec)
    return recommendations


