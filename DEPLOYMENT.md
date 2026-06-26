# Deployment Guide - ITR Tracker

This guide details how to deploy the ITR Tracker application. Since it consists of a React frontend and a Flask backend, the recommended and most flexible architecture is to host them separately.

---

## 🖥️ Frontend Deployment (Vercel)

You can host the React frontend on **Vercel** for free.

### Steps to Deploy:
1. Push this codebase to your GitHub repository: `https://github.com/vivekgkc-pixel/ITR-Tracker.git`
2. Log in to [Vercel](https://vercel.com) and click **Add New** > **Project**.
3. Import your `ITR-Tracker` repository.
4. In the **Configure Project** step:
   - **Root Directory**: Select `frontend` (Click edit and choose `frontend` directory).
   - **Build Command**: `npm run build` (or Vite's default build).
   - **Output Directory**: `dist` (Vercel automatically detects this).
5. **Environment Variables**:
   - Under the Environment Variables section, add:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://your-backend-api-url.onrender.com/api` (Replace this with your deployed backend URL from the steps below).
6. Click **Deploy**.

---

## ⚙️ Backend Deployment (Render or Railway)

Since the Flask backend has persistent background tasks (schedulers) and SQLite database dependencies, it should be deployed on a server hosting platform like **Render**, **Railway**, or **PythonAnywhere**.

### Option A: Deploying on Render (Recommended & Free)
1. Go to [Render](https://render.com) and create an account.
2. Click **New** > **Web Service**.
3. Connect your GitHub repository.
4. In the settings configuration:
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app` (Make sure gunicorn is in your requirements or install it).
5. **Disk Storage (SQLite Persistence)**:
   - If using the local SQLite database, add a persistent volume mount (Disk) in Render.
   - Set **Mount Path** to `/opt/render/project/src/backend/instance`.
   - Update your Environment Variable `DATABASE_URL` to point to `/opt/render/project/src/backend/instance/itr_tracker.db`.
6. **Environment Variables**:
   - Add variables from your `backend/.env`:
     - `SECRET_KEY` = your secret
     - `JWT_SECRET_KEY` = your jwt secret
     - `DATABASE_URL` = (Set to a PostgreSQL database url like Neon/Supabase, or a persistent SQLite path).
     - `CORS_ORIGINS` = `https://your-vercel-frontend-domain.vercel.app` (Add your frontend URL to authorize CORS).
     - Configure Twilio/Email SMTP variables as required.

---

## 🗄️ Database Choice
For serverless/cloud environments, it is highly recommended to use a managed database (like Postgres on **Supabase** or **Neon**) instead of SQLite, as it is fully stateless, scales automatically, and doesn't require configuring persistent volumes:
- Set `DATABASE_URL` to your Neon/Supabase PostgreSQL connection string, and Flask will automatically initialize and manage the tables!
