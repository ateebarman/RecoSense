# Recommendation System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How Recommendations Are Fetched](#how-recommendations-are-fetched)
4. [How the Model Runs](#how-the-model-runs)
5. [Counter-Based Auto-Triggering](#counter-based-auto-triggering)
6. [API Endpoints](#api-endpoints)
7. [Configuration](#configuration)
8. [Admin Features](#admin-features)
9. [Setup Instructions](#setup-instructions)
10. [Workflow Examples](#workflow-examples)
11. [Database Schema](#database-schema)
12. [File Structure](#file-structure)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The Recommendation System is a hybrid approach that combines multiple recommendation strategies to provide personalized product suggestions to users. Instead of running heavy model training on every interaction, the system uses a **counter-based approach** that automatically recomputes recommendations when users accumulate enough interactions (likes + reviews).

### Key Features
- **Aspect-based content filtering**: Analyzes product reviews for specific attributes (quality, durability, value, etc.)
- **Demographic cold-start**: Recommends popular products within a user's age group and gender
- **Popularity-based fallback**: Fast recomputation when data updates
- **CPU-efficient**: No heavy training required; uses in-memory Node.js computations
- **Auto-triggering**: Automatically reruns recommendations after threshold of interactions
- **Admin controls**: Manual triggering, counters inspection, and status monitoring

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                     Frontend (React)                 │
│  - Product browsing, like toggles, review submission │
├─────────────────────────────────────────────────────┤
│                      Express API                      │
│  - /api/recommendations (GET) - fetch recs          │
│  - /api/recommendations/model/run (POST) - trigger  │
│  - /api/user/:id/like (PUT) - toggle likes          │
│  - /api/reviews (POST) - add reviews                │
├─────────────────────────────────────────────────────┤
│                  RecommendationController            │
│  - merges DB likes + file reviews                   │
│  - selects recommendation source                    │
│  - returns ranked products                          │
├─────────────────────────────────────────────────────┤
│                  RetrainManager                       │
│  - manages counter state (retrain_counters.json)    │
│  - triggers infer-only runs when threshold met      │
│  - writes status and logs                           │
├─────────────────────────────────────────────────────┤
│           Node-Based Infer Module                    │
│  - reads reviews + DB likes                         │
│  - computes popularity ranks                        │
│  - generates per-user recs (lightfm_recs.json)      │
├─────────────────────────────────────────────────────┤
│                    MongoDB                           │
│  - Users (user_id, likedProducts, demographics)     │
│  - Reviews (user_id, asin, rating, text)            │
│  - Products (metadata, pricing)                     │
├─────────────────────────────────────────────────────┤
│              Data Files (JSON)                       │
│  - filtered_smartphone_reviews.json                 │
│  - filtered_smartphone_metadata.json                │
│  - lightfm_recs.json (precomputed recommendations)  │
└─────────────────────────────────────────────────────┘
```

---

## How Recommendations Are Fetched

### Step-by-Step Flow

When a user requests recommendations via **GET /api/recommendations**:

#### 1. **Merge Data Sources**
```
UserController & RecommendationController
├─ Read from MongoDB:
│  ├─ User's liked products
│  └─ All user reviews from DB
├─ Read from JSON file:
│  └─ Historical reviews (filtered_smartphone_reviews.json)
└─ Combine: [{user_id, asin, rating}, ...]
```

#### 2. **Decide Recommendation Source**

The system picks the best recommendation strategy based on what's available:

```javascript
// Priority order:
1. If lightfm_recs.json exists AND user has >= LIGHTFM_THRESHOLD interactions
   → Use precomputed LightFM recommendations (best accuracy)
   → Set model_used: "lightfm"

2. Else if user belongs to age_group + gender demographic
   → Count popular products in that demographic
   → Filter out products user already interacted with
   → Sort by popularity within demographic
   → Set model_used: "demographic_popularity"

3. Else (new user, no demographic data)
   → Return global top-N popular products
   → Set model_used: "global_popularity"
```

#### 3. **Return Ranked Products**

```javascript
Response format:
{
  "recommendations": [
    {
      "rank": 1,
      "asin": "B01ABC123",
      "score": 42.5,           // popularity count or model score
      "title": "Smartphone XYZ",
      "price": 599.99,
      "category": "Electronics",
      "images": ["url1", "url2"]
    },
    ...
  ],
  "model_used": "demographic_popularity",
  "user_interactions": 5,          // total likes + reviews
  "threshold_remaining": 5         // how many more to trigger infer
}
```

---

## How the Model Runs

### Infer-Only Mode (Fast Recomputation)

The system uses a **lightweight, Node.js-based inference** approach that avoids heavy machine learning training:

### When Model Runs

**Automatic Trigger:**
- User adds a like
- User submits a review
- Counter increments
- When counter >= `MODEL_RUN_THRESHOLD` (default: 10)
  → `startModelRun()` is called asynchronously
  → Returns 202 (Accepted) to client
  → Runs in background

**Manual Trigger:**
- Admin POST `/api/recommendations/model/run`
- Bypasses threshold requirement
- Also async

### What the Model Run Does

```
retrainManager.startModelRun()
├─ Try Node.js infer (preferred)
│  ├─ Load reviews from JSON file
│  ├─ Fetch likes from MongoDB
│  ├─ Build interaction matrix:
│  │  {user_id -> [asin1, asin2, ...], rating: 1-5}
│  ├─ Compute per-item popularity:
│  │  counts[asin] = sum of all user interactions with asin
│  ├─ Sort items by count (descending)
│  ├─ For each user:
│  │  ├─ Find items they haven't interacted with
│  │  ├─ Rank by popularity
│  │  ├─ Add metadata (title, price, images)
│  │  └─ Top 20 items -> per-user recommendation list
│  └─ Write to lightfm_recs.json
│
└─ Fallback: Try Python --infer-only (if Node fails)
   ├─ Same logic as above but in Python
   └─ Also writes lightfm_recs.json
```

### Output: lightfm_recs.json

```json
{
  "USER_123": [
    {
      "rank": 1,
      "asin": "B001",
      "score": 45,
      "title": "Product A",
      "price": 299.99,
      "category": "Electronics"
    },
    {
      "rank": 2,
      "asin": "B002",
      "score": 42,
      "title": "Product B",
      "price": 199.99,
      "category": "Electronics"
    }
    // ... top 20 items
  ],
  "USER_456": [ ... ]
}
```

### Performance

- **Duration**: < 100ms (Node.js), < 5 seconds (Python fallback)
- **CPU**: Minimal (sorting + counting)
- **Memory**: In-memory operations, no model serialization
- **Scalability**: O(n*m) where n=users, m=items

---

## Counter-Based Auto-Triggering

### Why Counters?

Instead of retraining on a schedule or retrain trigger, the system tracks **interaction accumulation** and automatically refreshes recommendations when data changes significantly.

### Counter Flow

```
User Action
├─ Like: toggleLikeProduct() → incrementCounter('like', 1)
├─ Review: addReview() → incrementCounter('review', 1)
└─ Each increments counter.pending

Counter State (retrain_counters.json):
{
  "pending": 3,      // total interactions since last run
  "likes": 2,        // breakdown: 2 likes
  "reviews": 1       // breakdown: 1 review
}

Threshold Check:
└─ if (pending >= MODEL_RUN_THRESHOLD)
   ├─ Call startModelRun()
   ├─ Wait for completion (async, non-blocking)
   └─ On success: reset counters to {pending: 0, likes: 0, reviews: 0}
```

### Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `MODEL_RUN_THRESHOLD` | 10 | Number of interactions before auto-trigger |
| `LIGHTFM_THRESHOLD` | 3 | Interactions needed to use LightFM recs |
| `DEMO_LIKED_WEIGHT` | 4.0 | Interaction score for likes (vs reviews) |
| `DEMO_REVIEW_WEIGHT` | 1.0 | Interaction score for reviews |

---

## API Endpoints

### Recommendation Endpoints

#### 1. **GET /api/recommendations**
Fetch recommendations for a user.

**Parameters:**
- `user_id` (query): Optional, user to get recs for
- `top_n` (query): Default 10, number of recommendations

**Response:**
```json
{
  "recommendations": [
    {
      "rank": 1,
      "asin": "B01",
      "score": 45,
      "title": "Product",
      "price": 299.99,
      "images": []
    }
  ],
  "model_used": "demographic_popularity",
  "user_interactions": 5,
  "threshold_remaining": 5
}
```

---

#### 2. **POST /api/recommendations/model/run** ⚙️ (Admin Only)
Manually trigger an infer-only model run.

**Auth:**
- Prefer `Authorization: Bearer <token>` where the token belongs to an admin user. For backwards compatibility the server will also accept `x-user-id` header containing an admin user id (legacy mode), but using JWT is recommended.

**Response:**
```json
{
  "message": "Model run started",
  "started": true,
  "pid": 12345
}
```

**Status Code:** 202 (Accepted) - runs asynchronously

---

#### 3. **GET /api/recommendations/retrain/status**
Check the current status of model runs.

**Response:**
```json
{
  "status": "success",            // success | failed | running | idle
  "pid": null,                     // process ID if running
  "started_at": "2025-12-15T15:42:41.579Z",
  "finished_at": "2025-12-15T15:42:41.661Z",
  "msg": "ok",                     // exit code or error message
  "outLog": "/path/to/.out.log",   // stdout log file
  "errLog": "/path/to/.err.log",   // stderr log file
  "mode": "infer"                  // "retrain" or "infer"
}
```

---

#### 4. **GET /api/recommendations/model/counters** ⚙️ (Admin Only)
View current interaction counters.

**Headers:**
- `x-user-id`: Admin user ID

**Response:**
```json
{
  "pending": 3,
  "likes": 2,
  "reviews": 1
}
```

---

#### 5. **POST /api/recommendations/model/counters/reset** ⚙️ (Admin Only)
Reset counters to zero.

**Headers:**
- `x-user-id`: Admin user ID

**Response:**
```json
{
  "pending": 0,
  "likes": 0,
  "reviews": 0
}
```

---

### Authentication & User Endpoints

#### A. **POST /api/user/login**
Authenticate a user and receive a JWT.

**Body:**
```json
{ "user_id": "USER_123", "password": "your-password" }
```

**Response:**
```json
{ "token": "<jwt>", "user": { "user_id": "USER_123", "reviewerName": "John", "isAdmin": false } }
```

#### B. **POST /api/user/register**
Register a new user (password optional). If `password` is supplied it's stored hashed.

**Body:**
```json
{ "user_id": "optional", "reviewerName": "Name", "password": "pass123", "age_group": "25-34", "gender": "other", "location": "US" }
```

**Response:**
- 201 Created with the created user object (no `password` field returned)

#### C. **POST /api/user/change-password** (Authenticated)
Change the logged-in user's password. Requires `Authorization: Bearer <token>` header.

**Body:**
```json
{ "currentPassword": "old", "newPassword": "new" }
```

**Response:**
```json
{ "message": "Password updated" }
```

#### D. **GET /api/user/me** (Authenticated)
Get the authenticated user's profile (no `password` field). Requires `Authorization: Bearer <token>`.

---

### User Interaction Endpoints

#### 6. **PUT /api/user/:user_id/like**
Toggle a like on a product. **Auto-increments counter.**

**Body:**
```json
{
  "asin": "B01ABC123"
}
```

**Response:**
```json
{
  "user_id": "USER_101",
  "likedProducts": ["B01", "B02", "B03"]
}
```

**Side Effect:** 
- Calls `incrementCounter('like', 1)`
- If pending count reaches threshold → model run triggered

---

#### 7. **POST /api/reviews**
Add a review for a product. **Auto-increments counter.**

**Body:**
```json
{
  "asin": "B01ABC123",
  "user_id": "USER_101",
  "reviewerName": "John Doe",
  "reviewText": "Great product!",
  "summary": "Excellent quality",
  "overall": 5
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user_id": "USER_101",
  "asin": "B01ABC123",
  "overall": 5,
  "reviewTime": "12/15/2025",
  "createdAt": "2025-12-15T15:42:41.579Z"
}
```

**Side Effect:**
- Calls `incrementCounter('review', 1)`
- If pending count reaches threshold → model run triggered

---

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/recommender_db
MONGO_DB=recommender_db

# Server
PORT=5001
SERVE_FRONTEND=false

# Recommendation thresholds
MODEL_RUN_THRESHOLD=10          # interactions before auto model run
LIGHTFM_THRESHOLD=3             # interactions to use LightFM recs

# Demographic weighting
DEMO_LIKED_WEIGHT=4.0           # weight for likes in popularity calculation
DEMO_REVIEW_WEIGHT=1.0          # weight for reviews in popularity calculation

# Python executable (optional)
PYTHON_EXECUTABLE=/path/to/venv/python

# Admin features
ADMIN_SECRET=your-secret-key    # secret for admin registration
ADMIN_USERS=TEST_USER_101,USER_2

# Scheduling (optional)
RETRAIN_CRON=0 3 * * *          # daily at 03:00 (cron format)
```

---

## Admin Features

### Who is Admin?

Admins can:
- Manually trigger model runs
- View and reset counters
- Clean recommendation files
- Monitor model run status

**Current Admins:**
```bash
TEST_USER_101  (isAdmin: true)
```

### How to Become Admin

#### Option 1: Environment Variable
```env
ADMIN_USERS=TEST_USER_101,NEW_USER_ID
```
(Restart server after setting)

#### Option 2: CLI Tool
```bash
cd backend
node tools/set_admin.js NEW_USER_ID
```

#### Option 3: Registration with Secret
```bash
curl -X POST "http://localhost:5001/api/user/register" \
  -H "x-admin-secret: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "ADMIN_USER_2",
    "reviewerName": "Admin User",
    "age_group": "25-34",
    "gender": "male",
    "location": "USA",
    "isAdmin": true
  }'
```

### Admin UI

**Frontend Page:** `/admin`
- Visible only to logged-in admin users
- Buttons:
  - **Trigger Retrain**: Full model retrain (if LightFM available)
  - **Clean Rec File**: Remove stale users from lightfm_recs.json
  - **Run Model (Infer-Only)**: Lightweight recompute
  - **Get Model Counters**: View current counter state
  - **Reset Counters**: Reset to zero
  - **Refresh Status**: Fetch latest model run status

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Python 3.8+ (optional, for Python fallback)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and settings
```

### Step 3: Seed Initial Data

```bash
cd backend
npm run seed
# Creates sample users, products, and reviews
```

### Step 4: Generate Initial Recommendations

```bash
cd backend
npm run model:run    # Infer-only recompute
# OR
npm run train:lightfm  # Full training (if LightFM installed)
```

### Step 5: Start Server

```bash
cd backend
npm start
# Server runs on http://localhost:5001
```

### Step 6: Start Frontend

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Workflow Examples

### Example 1: New User Gets Recommendations

```
1. User registers via /api/user/register
   ├─ age_group: "25-34"
   ├─ gender: "female"
   └─ location: "India"

2. User visits homepage, clicks "Recommendations"
   └─ GET /api/recommendations?user_id=USER_123

3. Controller merges data:
   ├─ Reads DB: user has 0 likes
   ├─ Reads JSON: user has 0 reviews
   └─ likedProducts: [], total interactions: 0

4. Since interactions < LIGHTFM_THRESHOLD:
   └─ Use demographic cold-start

5. Find popular products in demographic (25-34, female):
   ├─ Count products reviewed/liked by similar users
   ├─ Sort by popularity
   └─ Return top 10

6. Response includes:
   {
     "model_used": "demographic_popularity",
     "user_interactions": 0,
     "threshold_remaining": 10
   }
```

### Example 2: User Adds Interactions, Auto-Trigger Occurs

```
1. User likes product B01
   └─ PUT /api/user/USER_123/like
   └─ toggleLikeProduct() → incrementCounter('like', 1)

2. Counter state:
   {
     "pending": 1,
     "likes": 1,
     "reviews": 0
   }

3. User adds 9 more likes
   └─ Counters increment: pending=10, likes=10

4. User adds 1 review
   └─ PUT /api/reviews
   └─ incrementCounter('review', 1)

5. Counter state:
   {
     "pending": 11,  ← THRESHOLD MET (>= 10)
     "likes": 10,
     "reviews": 1
   }

6. Server detects threshold:
   ├─ Calls startModelRun()
   ├─ Returns 202 to user (non-blocking)
   └─ Runs infer in background

7. Model run completes (< 100ms):
   ├─ Recomputes all user recommendations
   ├─ Writes to lightfm_recs.json
   ├─ Resets counters: {pending: 0, likes: 0, reviews: 0}
   └─ Status written to retrain_status.json

8. Next recommendation request:
   ├─ Checks lightfm_recs.json (exists + fresh)
   ├─ User now has 11 interactions (> LIGHTFM_THRESHOLD=3)
   └─ Response includes fresh LightFM recommendations
```

### Example 3: Admin Manually Triggers Model Run

```
1. Admin logs in (isAdmin=true)
   └─ Navigates to /admin

2. Clicks "Run Model (Infer-Only)"
   └─ POST /api/recommendations/model/run
   └─ Header: x-user-id: TEST_USER_101

3. Server verifies admin:
   ├─ Checks requireAdmin middleware
   ├─ Finds user in DB
   ├─ Confirms isAdmin=true
   └─ Proceeds

4. retrainManager.startModelRun():
   ├─ Writes status: {status: "running"}
   ├─ Spawns Node infer process
   └─ Returns 202 immediately

5. Frontend shows "Model run started"
   ├─ Admin can click "Refresh Status"
   ├─ Polls GET /api/recommendations/retrain/status
   └─ Sees: {status: "success", finished_at: "..."}

6. Model run completed
   └─ Recommendations across all users updated
```

---

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  user_id: String (unique),           // "USER_123"
  reviewerName: String,               // "John Doe"
  likedProducts: [String],            // ["B01", "B02", ...]
  age_group: String,                  // "25-34", "35-44", ...
  gender: String,                     // "male", "female", "other"
  location: String,                   // "USA", "India", ...
  isAdmin: Boolean,                   // true/false
  createdAt: Date,
  updatedAt: Date
}
```

### Review Model

```javascript
{
  _id: ObjectId,
  user_id: String,                    // "USER_123"
  asin: String,                       // "B01ABC123"
  reviewerName: String,               // "John Doe"
  reviewText: String,                 // "Great product!"
  summary: String,                    // "Excellent"
  overall: Number,                    // 1-5
  verified: Boolean,
  reviewTime: String,                 // "12/15/2025"
  unixReviewTime: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model

```javascript
{
  _id: ObjectId,
  asin: String (unique),              // "B01ABC123"
  title: String,                      // "Smartphone XYZ"
  price: Number,                      // 599.99
  category: String,                   // "Electronics"
  images: [String],                   // ["url1", "url2"]
  createdAt: Date,
  updatedAt: Date
}
```

---

## File Structure

```
backend/
├── server.js                          # Express app entry
├── .env                               # Configuration
├── package.json
├── seed.js                            # Database seeding
│
├── models/
│  ├── userModel.js
│  ├── reviewModel.js
│  └── productModel.js
│
├── controllers/
│  ├── userController.js
│  ├── reviewController.js
│  ├── recommendationController.js    # Recommendation logic
│  └── ...
│
├── routes/
│  ├── userRoutes.js
│  ├── reviewRoutes.js
│  ├── recommendationRoutes.js        # Recommendation endpoints
│  └── ...
│
├── middleware/
│  └── requireAdmin.js                # Admin auth check
│
├── recommender/
│  ├── retrainManager.js              # Counter + trigger logic
│  ├── train_lightfm.py               # Python training (fallback)
│  ├── retrain_status.json            # Model run status
│  ├── retrain_counters.json          # Interaction counters
│  ├── logs/                          # retrain logs
│  │  ├── modelrun-*.out.log
│  │  └── modelrun-*.err.log
│  └── requirements.txt               # Python deps
│
├── data/
│  ├── filtered_smartphone_reviews.json        # Review corpus
│  ├── filtered_smartphone_metadata.json       # Product metadata
│  └── lightfm_recs.json                       # Precomputed recommendations
│
└── tools/
   ├── set_admin.js                   # CLI: make user admin
   └── add_likes.js                   # CLI: add test likes

frontend/
├── src/
│  ├── pages/
│  │  ├── Home.jsx
│  │  ├── Recommendations.jsx         # Display recs
│  │  ├── MyReviews.jsx               # User reviews
│  │  ├── Login.jsx                   # Auth
│  │  ├── AdminPanel.jsx              # Admin controls
│  │  └── ...
│  ├── components/
│  │  ├── ProductCard.jsx
│  │  ├── ReviewCard.jsx
│  │  ├── Navbar.jsx
│  │  └── ...
│  ├── services/
│  │  └── api.js                      # API client (runModel, getCounters, etc.)
│  ├── context/
│  │  ├── UserContext.jsx             # Auth + isAdmin
│  │  └── CartContext.jsx
│  └── App.jsx                        # Routes
└── package.json
```

---

## Troubleshooting

### Issue 1: Model Run Fails with "process_not_found"

**Symptom:**
```
GET /api/recommendations/retrain/status
→ {status: "failed", msg: "process_not_found"}
```

**Causes:**
1. Python process crashed/exited early
2. Missing Python packages (python-dotenv, pandas)
3. Incorrect PYTHON_EXECUTABLE path

**Solutions:**
```bash
# Ensure Python venv is set up and packages installed
cd backend
python -m venv .venv
.\.venv\Scripts\activate    # or source .venv/bin/activate on Linux
pip install -r recommender/requirements.txt

# Test infer directly
python recommender/train_lightfm.py --infer-only

# Check logs
cat backend/recommender/logs/modelrun-*.err.log
```

---

### Issue 2: Counters Don't Reset After Model Run

**Symptom:**
```
GET /api/recommendations/model/counters
→ {pending: 10, likes: 8, reviews: 2}  (should be 0 after run)
```

**Cause:** Model run failed or didn't complete successfully.

**Solution:**
```bash
# Check status
curl http://localhost:5001/api/recommendations/retrain/status

# Manually reset
curl -X POST http://localhost:5001/api/recommendations/model/counters/reset \
  -H "x-user-id: TEST_USER_101"
```

---

### Issue 3: Admin Endpoints Return 403 "Admin privileges required"

**Symptom:**
```
POST /api/recommendations/model/run
→ 403 Admin privileges required
```

**Causes:**
1. Missing `x-user-id` header
2. User is not marked as admin
3. User doesn't exist in database

**Solution:**
```bash
# Check if user is admin
curl http://localhost:5001/api/user/TEST_USER_101
# Look for "isAdmin": true

# Make user admin
cd backend
node tools/set_admin.js TEST_USER_101

# Verify
curl http://localhost:5001/api/user/TEST_USER_101 | grep isAdmin
```

---

### Issue 4: Recommendations Are Stale (Not Updated After Model Run)

**Symptom:**
```
POST /api/recommendations/model/run → 202 (success)
But GET /api/recommendations still shows old products
```

**Cause:** lightfm_recs.json wasn't written or is corrupted.

**Solution:**
```bash
# Check if file exists and is valid JSON
cat backend/data/lightfm_recs.json | head -20

# If corrupted, manually trigger with Python
cd backend
python recommender/train_lightfm.py --infer-only

# Or reset and retry
curl -X POST http://localhost:5001/api/recommendations/model/counters/reset \
  -H "x-user-id: TEST_USER_101"
curl -X POST http://localhost:5001/api/recommendations/model/run \
  -H "x-user-id: TEST_USER_101"
```

---

### Issue 5: New Users Don't Get Demographic Recommendations

**Symptom:**
```
New user registers without age_group/gender
GET /api/recommendations returns empty or global recs
```

**Cause:** User has no demographic data.

**Solution:**
```bash
# Ensure registration includes demographics
POST /api/user/register
{
  "user_id": "USER_NEW",
  "reviewerName": "Jane Doe",
  "age_group": "25-34",      # Required for demographic cold-start
  "gender": "female",
  "location": "USA"
}

# Or update user manually in MongoDB
db.users.updateOne(
  { user_id: "USER_NEW" },
  { $set: { age_group: "25-34", gender: "female", location: "USA" } }
)
```

---

### Issue 6: High Latency on First Recommendation Request

**Symptom:**
```
First GET /api/recommendations takes 5+ seconds
```

**Cause:** MongoDB query or merge operation is slow.

**Solution:**
```bash
# Add database indexes
# (In MongoDB shell)
db.reviews.createIndex({ "user_id": 1 })
db.reviews.createIndex({ "asin": 1 })
db.users.createIndex({ "user_id": 1 })

# Reduce data size (if reviews file is very large)
# Truncate filtered_smartphone_reviews.json to recent reviews
```

---

## Summary

| Feature | How It Works |
|---------|-------------|
| **Recommendation Fetch** | Merge DB + file data, pick best source (LightFM > demographic > global), return ranked products |
| **Auto-Trigger** | Count likes + reviews; when >= threshold (default 10), spawn non-blocking infer run |
| **Model Run** | Node.js computes popularity, generates per-user top-20, writes to JSON (< 100ms) |
| **Admin Control** | requireAdmin middleware checks isAdmin flag; admins can trigger, reset, monitor |
| **Status Tracking** | retrain_status.json stores run state, logs saved to logs/ directory |
| **Fallback** | If Node infer fails, spawn Python --infer-only as backup |

This design **avoids heavy retraining**, is **CPU-efficient**, and **auto-adapts** as users add interactions.

---

## Quick Start Commands

```bash
# Setup
cd backend
npm install
npm run seed

# Start
npm start

# Trigger model run
curl -X POST http://localhost:5001/api/recommendations/model/run \
  -H "x-user-id: TEST_USER_101"

# Check status
curl http://localhost:5001/api/recommendations/retrain/status

# View counters
curl http://localhost:5001/api/recommendations/model/counters \
  -H "x-user-id: TEST_USER_101"

# Reset counters
curl -X POST http://localhost:5001/api/recommendations/model/counters/reset \
  -H "x-user-id: TEST_USER_101"
```

---

## Questions?

Refer to the specific section above or check the actual implementation:
- Recommendation logic: `backend/controllers/recommendationController.js`
- Counter management: `backend/recommender/retrainManager.js`
- API routes: `backend/routes/recommendationRoutes.js`
- Frontend UI: `frontend/src/pages/AdminPanel.jsx`
