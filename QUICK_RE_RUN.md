# ⚡ RecoSense: Quick Re-run (Level 1)
**Type:** Lightweight JavaScript Logic  
**Trigger:** Automatic (every *N* interactions)  
**Execution Time:** ~5–10 seconds

## 📝 Overview
The **Quick Re-run** is the responsive, high-availability layer of the RecoSense engine. Its primary goal is to ensure that the recommendation database in MongoDB stays fresh even between heavy AI training sessions. It uses a "Wisdom of the Crowd" heuristic approach to provide high-quality, trending recommendations instantly.

---

## 🚀 Step-by-Step Lifecycle

### 1. The Trigger
- **Interaction Counting:** Every time a user "Likes" a product or leaves a "Review," the system increments a `pending_interactions` counter in MongoDB.
- **Threshold Check:** Once the counter hits the threshold (e.g., 5 or 10), the `retrainManager.js` starts a background task.
- **Locking:** It sets the system status to `running`, preventing multiple re-runs from overlapping.

### 2. Data Gathering (Hybrid Source)
- **Historical Data:** Reads the static `filtered_smartphone_reviews.json` (~375 entries) to establish a baseline of long-term trends.
- **Live Data (Live Likes):** Queries MongoDB directly to fetch every user's `likedProducts`. This captures what is happening **right now** on the site.
- **Merging:** Combines both sources into a single interaction pool.

### 3. The Popularity Heuristic
- Unlike AI, which tries to guess your specific taste, this re-run calculates **Global Popularity Scores**.
- It counts how many times each product (`asin`) appears in the combined interaction pool.
- It ranks products from most-liked to least-liked.

### 4. Personal Filtering
For every user in the system, the engine:
1. Takes the global ranked list.
2. Removes products the user has **already liked** (no one wants to be recommended what they just bought!).
3. Selects the Top 20 remaining items.

### 5. Metadata Enrichment
- It loads the `filtered_smartphone_metadata.json`.
- It maps the "Product Codes" (ASINs) back to human-readable labels: **Titles, Prices, Categories, and High-Res Images**.
- This ensures the UI can display beautiful product cards without doing extra database lookups later.

### 6. Atomic Database Sync
- The results are pushed into the `recommendations` collection in MongoDB.
- The `SystemConfig` is updated to `success`, and the interaction counter is reset to 0.

---

## 🧠 Key Concepts

### Why JavaScript?
By running this in Node.js instead of Python, we avoid the overhead of starting a virtual machine or loading massive ML libraries like TensorFlow or Scikit-learn. It’s pure, fast data manipulation.

### Wisdom of the Crowd
This concept assumes that if 50 people liked a specific phone today, it’s probably a good recommendation for a 51st person who hasn't seen it yet. It solves the "Cold Start" problem by giving new users something high-quality to look at immediately.

### Non-Blocking I/O
The entire process runs in the background. The user can keep browsing the site while the engine is recalculating their future recommendations in another thread.
