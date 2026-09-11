# Deployment Guide

Recommended setup:

- Vercel: React frontend in `frontend/`
- Render: FastAPI backend in `app/`
- Optional Render service: mock iGOT API in `mock_igot/`

## 1. Push Code To GitHub

Commit and push this repository to GitHub. Render and Vercel will deploy from that repository.

## 2. Deploy Backend On Render

Create a Render Web Service.

Settings:

```txt
Root Directory: .
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```txt
GOOGLE_API_KEY=your_gemini_api_key
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
DATA_DIR=/opt/render/project/src/data
ENABLE_SEMANTIC_SEARCH=false
```

Health check URL:

```txt
https://your-render-backend.onrender.com/api/health
```

For a hackathon demo, SQLite is fine. For data that must survive redeploys/restarts, add a Render persistent disk mounted at:

```txt
/opt/render/project/src/data
```

Keep `ENABLE_SEMANTIC_SEARCH=false` on Render free instances. The semantic
index uses `sentence-transformers`/ChromaDB and can exceed the 512 MB memory
limit. With it disabled, the semantic recommendations endpoint falls back to
lightweight tag-based recommendations in the same response shape.

## 3. Deploy Frontend On Vercel

Import the same GitHub repo in Vercel.

Settings:

```txt
Root Directory: frontend
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```txt
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

After Vercel deploys, copy the Vercel URL and update Render's backend environment variable:

```txt
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Then redeploy the Render backend.

## 4. Optional Mock iGOT Service

Deploy a second Render Web Service only if you need the mock iGOT integration.

Settings:

```txt
Root Directory: .
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn mock_igot.app:app --host 0.0.0.0 --port $PORT
```

Environment variable:

```txt
LMS_WEBHOOK_URL=https://your-render-backend.onrender.com/webhooks/igot-status
```

You can manually advance an enrollment:

```txt
POST https://your-mock-igot.onrender.com/mock-igot/advance/E0003
```

Automatic background advancement requires Redis plus a Celery worker/beat service. Skip this for a simple SIH demo unless you specifically need automatic progress updates.
