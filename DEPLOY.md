# Deployment Guide

This project has two parts: the backend (Node/Express/MongoDB) and the frontend (Vite + React).

You can deploy them as two separate services (recommended) or as a single service (serve frontend files from backend).

## Environment variables
- `MONGO_URI` (required for backend) — MongoDB connection string (e.g., Atlas).
- `PORT` — optional; hosting platform usually sets this.
- `VITE_API_URL` (optional for frontend) — full URL to backend API, e.g. `https://my-backend.onrender.com/api`. If not set, the frontend will call relative `/api`.
- `SERVE_FRONTEND=true` (optional for backend) — when set, backend will serve files from `frontend/dist` (single-service deploy).

---

## Option A — Recommended: Two services (frontend + backend)

### Backend (web service)
- Root Directory: `backend`
- Build Command: `npm ci` or `npm install`
- Start Command: `npm start`
- Environment variables: `MONGO_URI` (set to your DB URI)
- Port: leave default (platform sets it)

### Frontend (Static Site)
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish / Output Directory: `dist`
- If the frontend needs to call the backend at a full URL, set `VITE_API_URL` to `https://your-backend-url` (include `/api` if you prefer full path).

Example (Render):
- Create one **Web Service** for the backend with `backend` as the root and `npm start` as the start command.
- Create one **Static Site** for the frontend using `frontend` as the root, `npm run build` as the build command and `dist` as the publish directory. Set `VITE_API_URL` as an Environment Variable if the backend is on a different origin.

### Render quick fields (UI)

Backend (Web Service):
- **Root Directory:** `backend`
- **Build Command:** `npm ci` (or `npm install`)
- **Start Command:** `npm start`
- **Environment:** Node
- **Env Vars:** `MONGO_URI` = `<your-mongo-uri>` (required). Optionally set `SERVE_FRONTEND=true` if you want the backend to serve the frontend build from `frontend/dist`.

Frontend (Static Site):
- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build` (or `yarn && yarn build`)
- **Publish Directory:** `dist`
- **Env Vars:** `VITE_API_URL` = `https://<your-backend>.onrender.com/api` (optional — only needed if backend is on a different origin).

If you prefer a single service on Render, set the backend service's **Build Command** to:

```
cd frontend && npm ci && npm run build && cd ../backend && npm ci
```

and **Start Command** to:

```
cd backend && npm start
```

Also set `SERVE_FRONTEND=true` and `MONGO_URI` as environment variables on the backend service.

### Optional: Continuous deployment via GitHub Actions

You can add CI that builds and triggers a Render deploy automatically when you push to `main`. I added `.github/workflows/ci-render-deploy.yml` which:

- Builds the frontend (`frontend`) and installs backend deps (`backend`).
- Triggers Render deploys via the Render REST API for each service.

To use it, add the following **GitHub repository secrets**:

- `RENDER_API_KEY` — your Render API key (create at https://dashboard.render.com/account/api-keys)
- `RENDER_BACKEND_SERVICE_ID` — the Render service ID for your backend
- `RENDER_FRONTEND_SERVICE_ID` — the Render service ID for your frontend (if you have a static site)

How to find a service ID on Render:
- Open the Render dashboard, go to the Service, and copy the final segment of the service URL or find it in the Service settings / API documentation. It typically looks like a long alphanumeric string.

After secrets are set, pushing to `main` will run the workflow and trigger the deploys automatically.

Notes:
- Vite exposes env vars that start with `VITE_` to the client (we use `VITE_API_URL`).
- The frontend code falls back to `/api` if `VITE_API_URL` is not set. This is convenient if you put both services under the same domain (proxying) or if you use the backend to serve the frontend.

---

## Option B — Single service (backend serves frontend)

1. Build the frontend locally or in your deployment step: `cd frontend && npm ci && npm run build`
2. Make sure the backend has `SERVE_FRONTEND=true` in the env.
3. Deploy the backend service only. Backend `server.js` includes code that will serve `frontend/dist` when `SERVE_FRONTEND` is set.

Pros: single deployment, simple DNS.
Cons: larger deploy artifact, you must rebuild frontend before starting backend.

---

## Platform-specific notes
- Render: The image you attached shows `Build Command` and `Start Command` fields. For the backend web service, use `npm ci` for build and `npm start` to run. For the frontend Static Site use `npm ci && npm run build` and `dist` as the publish directory.
- Vercel / Netlify: deploy frontend as static site directly from the `frontend` directory. Backend can be a separate server (e.g., Render) or Vercel Serverless Functions (requires refactor).

---

## Local testing tips
- Backend: create `.env` in `backend` with `MONGO_URI` set and run `npm run dev` (uses `nodemon`).
- Frontend: run `npm run dev` from `frontend`. To point the frontend to a deployed backend during development, set `VITE_API_URL` (e.g., `VITE_API_URL=https://...`), or use a proxy.

---

If you'd like, I can:
- Add a ready-to-use Render `service` configuration or a `render.yaml` example.
- Wire server-side pagination on the frontend to use the backend's `page`/`limit` API.
- Set up a GitHub Action to build and deploy both services automatically.

Which host are you planning to use (Render, Vercel, Netlify, Heroku)? I can generate exact steps or sample config for it.
