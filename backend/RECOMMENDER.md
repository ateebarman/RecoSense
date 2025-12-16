LightFM Recommender
===================

This project includes a simple LightFM training script that builds a user-item interaction matrix from the seeded review dataset and any `likedProducts` stored in MongoDB, trains a LightFM model, and writes per-user top-N recommendations to `backend/data/lightfm_recs.json`.

How to install (Python env)

```bash
python -m venv .venv
source .venv/bin/activate    # or .\.venv\Scripts\activate on Windows
pip install -r recommender/requirements.txt
```

How to run training

```bash
cd backend
python ./recommender/train_lightfm.py
# or use npm script
npm run train:lightfm
```

Trigger training from server

You can start training asynchronously by calling the retrain endpoint:

```
POST /api/recommendations/retrain
```

Additional endpoints

- `GET /api/recommendations/retrain/status` — return a JSON status object with `status`, `started_at`, `finished_at`, and log file paths.
- `POST /api/recommendations/retrain/clean` — sanitize `backend/data/lightfm_recs.json` by removing entries for users not present in the DB (returns number cleaned).

Model run by interaction count

- The server now supports a lightweight, infer-only model run (no heavy retraining) that recomputes per-user recommendations using current interactions and popularity. Trigger it manually with:

```
POST /api/recommendations/model/run
```

- Admin endpoints to inspect and reset the interaction counters:

```
GET /api/recommendations/model/counters
POST /api/recommendations/model/counters/reset
```

- Configure the number of interactions (likes + reviews) required to auto-trigger an infer-only run with the environment variable `MODEL_RUN_THRESHOLD` (default `10`). The server will track increments on likes and new reviews and automatically run the infer-only job when the threshold is reached.

Scheduler

Set the `RETRAIN_CRON` environment variable (cron string) to enable scheduled retrains, e.g. `RETRAIN_CRON='0 3 * * *'` to run daily at 03:00. The server will log when scheduled retrains are triggered.

Notes
- The training script will read `MONGO_URI` from `.env` to load users/likes.
- If `backend/data/lightfm_recs.json` is not present, the API will fallback to aspect-based or popularity recommendations.
