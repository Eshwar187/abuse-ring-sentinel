# Abuse-Ring Sentinel — Production Deployment Guide

This guide walks you through deploying:
1. **Database**: Aiven.io Cloud MySQL (Already configured & active!)
2. **Backend**: FastAPI + Frozen ML Model on **Render**
3. **Frontend**: Angular 20 SPA on **Vercel**

---

## 1. Cloud Database (Aiven.io MySQL) — [ACTIVE & VERIFIED]

- **Host**: `mysql-354f0a6e-jeshwar2009-6d66.c.aivencloud.com`
- **Port**: `16261`
- **Database**: `defaultdb`
- **User**: `avnadmin`
- **SSL Mode**: `REQUIRED`
- **Status**: All 13 schema tables initialized and verified.

---

## 2. Deploying Backend API to Render

### Option A: Using Render Blueprint (Fastest — 1 Click)

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\to$ **Blueprint**.
3. Select your `abuse-ring-sentinel` GitHub repository.
4. Render will detect `render.yaml` and prompt you for the secret values (`DATABASE_URL` and `MYSQL_PASSWORD`).
5. Paste your Aiven database credentials when prompted and click **Apply**.

### Option B: Manual Web Service Setup on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) $\to$ **New +** $\to$ **Web Service**.
2. Connect your GitHub repository.
3. Configure the following:
   - **Name**: `abuse-ring-sentinel-api`
   - **Language / Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables** in the Render dashboard:

| Variable | Value |
| :--- | :--- |
| `APP_ENV` | `production` |
| `DB_ENGINE` | `mysql` |
| `DATABASE_URL` | `mysql+pymysql://avnadmin:<YOUR_PASSWORD>@mysql-354f0a6e-jeshwar2009-6d66.c.aivencloud.com:16261/defaultdb` |
| `MYSQL_HOST` | `mysql-354f0a6e-jeshwar2009-6d66.c.aivencloud.com` |
| `MYSQL_PORT` | `16261` |
| `MYSQL_DATABASE` | `defaultdb` |
| `MYSQL_USER` | `avnadmin` |
| `MYSQL_PASSWORD` | `<YOUR_PASSWORD>` |
| `MYSQL_SSL_MODE` | `REQUIRED` |
| `CORS_ORIGINS` | `*` |
| `MODEL_PATH` | `models/model_f.joblib` |
| `LOG_LEVEL` | `INFO` |

5. Click **Create Web Service**.
6. Once deployed, Render will provide your public backend URL (e.g. `https://abuse-ring-sentinel-api.onrender.com`).

---

## 3. Deploying Frontend to Vercel

1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) $\to$ click **Add New...** $\to$ **Project**.
3. Import your `abuse-ring-sentinel` GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: `Angular`
   - **Root Directory**: `frontend` (Click edit and select `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/frontend/browser`
5. Click **Deploy**.
6. Vercel will build and launch your production web app (e.g. `https://abuse-ring-sentinel.vercel.app`).

---

## 4. Connecting Frontend to your Render Backend

Once your Render backend is live:
1. Open your deployed Vercel site in your browser.
2. In the top-right / settings, set the backend API endpoint to your Render URL:
   `https://abuse-ring-sentinel-api.onrender.com`
   *(Or Sentinel will automatically query the configured domain)*.
3. Test your live signup, login, transaction evaluation, and MySQL table inspection from anywhere in the world!
