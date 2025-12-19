# Deployment Guide

This project has two parts: the backend (Node/Express/MongoDB) and the frontend (Vite + React).

You can deploy them as two separate services (recommended) or as a single service (serve frontend files from backend).

## Environment variables
- `MONGO_URI` (required for backend) — MongoDB connection string (e.g., Atlas).
- `PORT` — optional; hosting platform usually sets this.
- `VITE_API_URL` (optional for frontend) — full URL to backend API, e.g. `https://my-backend.onrender.com/api`. If not set, the frontend will call relative `/api`.
- `SERVE_FRONTEND=true` (optional for backend) — when set, backend will serve files from `frontend/dist` (single-service deploy).- `JWT_SECRET` — secret used to sign JSON Web Tokens (used for auth). **Set this to a long random value in production.** If not set, the server uses a default fallback which is not secure for public deployments.
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
- **Auth:** set `JWT_SECRET` to a secure random value in production to sign JWT tokens (recommended).

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

### Render: Single-service step-by-step

1. In the Render dashboard create a **Web Service** and point it at your repository (branch `main`).
2. **Root Directory:** leave empty (use repo root).
3. **Build Command:** use one of the following (pick the one that matches your package manager):

	NPM:
	```bash
	cd frontend && npm ci && npm run build && cd ../backend && npm ci
	```

	Yarn:
	```bash
	cd frontend && yarn && yarn build && cd ../backend && yarn
	```

	These commands build `frontend/dist` first and then install backend dependencies.
4. **Start Command:**

	```bash
	cd backend && npm start
	```

5. **Environment**: Node
6. **Environment variables** (set in Render's UI):
	- `MONGO_URI` = your MongoDB connection string
	- `SERVE_FRONTEND` = `true`

7. (Optional) Do not set `VITE_API_URL`; leaving it unset causes the frontend to call relative `/api`, which is correct when the backend serves the frontend from the same origin.

Notes:
- Render runs the `Build Command` during deploy. When the build finishes, the service will use the `Start Command` to run the server.
- If you change frontend code, Render will rebuild and redeploy the backend service (because the build step includes the frontend build).
- If you need to debug build issues, check the Render deploy logs — they contain build and install output.


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
- Backend: create `.env` in `backend` with `MONGO_URI` set and run `npm run dev` (uses `nodemon`). Optionally set `JWT_SECRET` in `.env` to a secure value — otherwise a default fallback is used (not recommended for public deployments).
- Seeding & passwords: running `npm run seed` will create users derived from review data; seeded users are created with a default password of `123456` (hashed). To set the default password on existing accounts you can run `npm run set-passwords`. To create or update a convenient admin account with `user_id` = `1` (password `123456`) run `npm run create-admin`.
- Frontend: run `npm run dev` from `frontend`. To point the frontend to a deployed backend during development, set `VITE_API_URL` (e.g., `VITE_API_URL=https://...`), or use a proxy.

---

If you'd like, I can:
- Add a ready-to-use Render `service` configuration or a `render.yaml` example.
- Wire server-side pagination on the frontend to use the backend's `page`/`limit` API.
- Set up a GitHub Action to build and deploy both services automatically.

Which host are you planning to use (Render, Vercel, Netlify, Heroku)? I can generate exact steps or sample config for it.
