# RecoSense: Hybrid Recommender System Architecture

This document provides a deep dive into the **Recommender Engine** powering this application. It explains the dual-mode update system (Retrain vs. Re-run) and the automatic threshold pipeline that keeps the system synchronized with user behavior.

---

## 🧠 1. The Core Engine: Hybrid Recommendation
RecoSense uses a **Hybrid Recommender** strategy combining two distinct methodologies:
1.  **Collaborative Filtering (LightFM)**: Learns patterns based on user interactions (Users who liked X also liked Y).
2.  **Aspect-Based Sentiment Analysis (ABSA)**: Adjusts rankings based on specific product features (Battery, Camera, Price) extracted from thousands of Amazon reviews.

---

## 🚀 2. "Full Retrain": Deep Learning Mode (The Brain)
When you click **Run Full Retrain**, the system triggers a heavy-duty Machine Learning pipeline.

### What happens?
1.  **Process Spawn**: The Node.js backend spawns a Python child process.
2.  **Data Extraction**: Python connects to MongoDB and pulls every user interaction (Likes, Verified Purchases, Ratings).
3.  **Matrix Construction**: It creates a **Sparse Interaction Matrix**. If User A liked Phone B, a "1" is placed at that intersection; otherwise, it's "0".
4.  **LightFM Training**: The model trains for roughly 30-50 epochs. It calculates **Latent Factors**—hidden math properties that represent "interests" (e.g., a user's hidden preference for high-resolution screens).
5.  **Weight Optimization**: The engine uses **WARP (Weighted Approximate-Rank Pairwise)** loss, which is specifically designed to optimize the top-N results for recommendation lists.

**Results**: A globally updated understanding of user behavior. This is the only way for the AI to "learn" new general trends.

---

## ⚡ 3. "Quick Re-run": Cache Refresh Mode (The UI Patch)
The **Quick Re-run** is a lightweight "Inference" mode. It doesn't teach the AI anything new; instead, it uses what the AI *already knows* to update the results for specific users.

### What happens?
1.  **Node.js Execution**: Runs entirely in JavaScript (no Python overhead).
2.  **Interaction Scanning**: Quickly checks the database for the very latest "Likes" added in the last few minutes.
3.  **Popularity Fallback**: For new users who haven't been processed by the Python model yet, it uses a **Weighted Popularity Algorithm** to ensure they don't see a blank screen.
4.  **JSON Caching**: It overwrites `lightfm_recs.json` with the new ranking.

**Results**: Instant gratification for the user. If they like a phone, they can see new recommendations in under a second.

---

## 📈 4. The Pipeline: Automatic Thresholds
The system is designed to be self-maintaining. It uses a **Threshold Pipeline** to ensure the recommendations don't get "stale."

### How it works:
1.  **Tracking**: The system tracks a `pendingInteractionCount` in the `retrain_counters.json` file.
2.  **Increments**: Every time a user **Likes** a product or **Submits a Review**, the counter increases by 1.
3.  **Environmental Trigger**: We define a `MODEL_RUN_THRESHOLD` (default is **10**).
4.  **Auto-Execution**: 
    *   As soon as `(Likes + Reviews) >= Threshold`, the system automatically triggers a **Quick Re-run** in the background.
    *   It resets the counter once successful.

### Why use a Pipeline?
*   **Balance**: Training a model on *every single click* would crash the server. 
*   **Efficiency**: By batching interactions (e.g., every 10 or 50 clicks), we ensure the AI updates regularly enough to feel "smart" but sparsely enough to keep the server fast.

---

## 🛠️ Summary Table

| Feature | Full Retrain | Quick Re-run |
| :--- | :--- | :--- |
| **Technology** | Python (LightFM + Pandas) | Node.js (Mongoose + JSON) |
| **Logic** | Matrix Factorization (Patterns) | Popularity + Recency (Heuristics) |
| **Hardware** | High CPU (Mathematics) | Low CPU (Data Transfer) |
| **Speed** | 30 - 60 seconds | < 1 second |
| **Usage** | Weekly or Major Data Updates | Hourly or Automated by Threshold |

---

## 🔧 Environment Configuration
You can control the pipeline behavior in the `backend/.env` file:
*   `MODEL_RUN_THRESHOLD=10`: How many interactions trigger an auto-update.
*   `RETRAIN_CRON='0 3 * * *'`: Schedule a full "Brain Update" every night at 3 AM.
