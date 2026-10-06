# CricBot — Production Deployment & Operations Runbook

## 1. Architecture Overview

CricBot is an authoritative cricket law and match officiating assistant architected across three decoupled components:

```
┌───────────────────────────────────────────────────────────┐
│                      Client Layer                         │
│  React 18 + Vite (SPA)                                    │
│  - Hosted on Vercel / Render Static / Cloudflare Pages    │
│  - Code-split vendor bundle + SPA rewrites                │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTPS / REST API
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    Express API Gateway                    │
│  Node.js 20+ / Express 4                                  │
│  - Hosted on Render Web Service                           │
│  - Auth (JWT), Session Management, Rate Limiting          │
│  - Document Ingestion, Quiz Engine, Audit Logs            │
│  - Statutory Discrepancy & Bug Reporting                  │
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │ Internal HTTP
               ▼                             ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│       Database Layer         │ │     Python RAG Service    │
│  MongoDB Atlas Cluster       │ │  FastAPI + Motor (Python) │
│  - Document Chunks           │ │  - PyMuPDF Extraction     │
│  - Vector Search Index       │ │  - Authority Precedence   │
│  - Conversations & Reports   │ │  - Claim-Level Citations  │
└──────────────────────────────┘ └───────────────────────────┘
```

---

## 2. Software Requirements & System Prerequisites

| Component | Minimum Version | Recommended Version |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` | `v22.x LTS` |
| **npm** | `v10.x` | `v10.x` |
| **Python** | `v3.11.x` | `v3.11.9` |
| **MongoDB** | `v7.0+` | MongoDB Atlas Shared/Dedicated M0+ |

---

## 3. Environment Variable Reference

### A. Frontend (`client/.env`)
| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base endpoint for the Express API | `https://cricbot-api.onrender.com/api/v1` or `/api/v1` |

### B. Express Backend (`server/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | Runtime mode (`production`, `development`) | `production` |
| `PORT` | **Yes** | Server listening port | `5000` (or assigned by host `$PORT`) |
| `CLIENT_URL` | **Yes** | Primary frontend domain for CORS | `https://cricbot.vercel.app` |
| `ALLOWED_ORIGINS` | No | Comma-separated list of additional origins | `https://cricbot.vercel.app,https://criclaws.com` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cricket_laws?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Secret for signing tokens (min 32 chars) | Random 64-hex string (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | No | Lifetime of JWT tokens | `7d` |
| `LLM_PROVIDER` | No | Model provider (`gemini`, `openai`, `mock`) | `gemini` |
| `LLM_API_KEY` | **Yes** | Google Gemini API Key | `AIzaSy...` |
| `LLM_MODEL` | No | Gemini model name | `gemini-1.5-flash` |
| `USE_PYTHON_RAG` | No | Toggle Python microservice | `true` |
| `PYTHON_RAG_SERVICE_URL` | If RAG on | Internal URL of FastAPI service | `http://cricbot-rag:8000` or `http://127.0.0.1:8000` |
| `RATE_LIMIT_MAX_REQUESTS`| No | Max requests per 15 min per IP | `100` |
| `RATE_LIMIT_AUTH_MAX` | No | Max login/register attempts per 15 min | `10` |
| `DEVELOPER_EMAIL` | No | Direct contact for law reports | `saikrishnabathina999@gmail.com` |
| `GMAIL_APP_PASSWORD` | No | Optional: backend SMTP auto-email | 16-character Google App Password |

### C. Python FastAPI RAG Service (`rag-service/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | **Yes** | Environment state | `production` |
| `PORT` | **Yes** | Port to bind | `8000` (or assigned by host `$PORT`) |
| `HOST` | No | Host binding | `0.0.0.0` |
| `ALLOWED_ORIGINS` | No | Allowed callers | `*` or `https://cricbot-api.onrender.com` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection URI | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | **Yes** | Target database name | `cricket_laws` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key | `AIzaSy...` |
| `LLM_MODEL` | No | Gemini generation model | `gemini-1.5-flash` |
| `EMBEDDING_PROVIDER` | No | Embedding model type | `local` |
| `VECTOR_INDEX_NAME` | No | Atlas Search index name | `cricket_vector_index` |

---

## 4. MongoDB Atlas Configuration & Vector Search

1. **Cluster Setup**:
   - Create a MongoDB Atlas cluster (M0 Free or M10+).
   - In **Network Access**, add the IP addresses of your hosting providers (or `0.0.0.0/0` with strong password authentication).
   - In **Database Access**, create a dedicated user with `readWrite` role on the `cricket_laws` database.

2. **Atlas Vector Search Index**:
   In MongoDB Atlas, navigate to **Atlas Search** -> **Create Search Index** -> **JSON Editor**:
   - **Database & Collection**: `cricket_laws.documentchunks`
   - **Index Name**: `cricket_vector_index`
   - **Configuration**:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 768,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "lawNumber"
       },
       {
         "type": "filter",
         "path": "applicableFormat"
       },
       {
         "type": "filter",
         "path": "source.issuingOrganisation"
       }
     ]
   }
   ```

---

## 5. Deployment Instructions

### Option 1: Vercel (Frontend) + Render (Backend Services) [Recommended]

#### Step A: Deploy Backend API on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure settings:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/v1/health`
4. Add the required environment variables listed in Section 3B.
5. Deploy and copy your assigned service URL (e.g. `https://cricbot-api.onrender.com`).

#### Step B: Deploy Python RAG Service on Render (Optional if `USE_PYTHON_RAG=true`)
1. Create a second **Web Service** on Render.
2. Configure settings:
   - **Root Directory**: `rag-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
3. Add environment variables listed in Section 3C.
4. Copy the internal or public URL and set it as `PYTHON_RAG_SERVICE_URL` in the Express service.

#### Step C: Deploy Frontend on Vercel
1. In [Vercel](https://vercel.com), import the repository.
2. Set **Root Directory** to `client`.
3. Framework Preset will automatically detect **Vite**.
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://cricbot-api.onrender.com/api/v1`
5. Click **Deploy**. Vercel will build using [`client/vercel.json`](file:///d:/CricBot/client/vercel.json) ensuring full SPA routing across `/chat`, `/scenarios`, `/search`, `/quiz`, and `/admin/documents`.

### Option 2: Render Blueprint (`render.yaml`)
1. In Render, select **New** -> **Blueprint**.
2. Select your repository. Render will automatically parse [`render.yaml`](file:///d:/CricBot/render.yaml) and instantiate:
   - `cricbot-api` (Express Node Web Service)
   - `cricbot-rag` (Python FastAPI Web Service)
   - `cricbot-client` (Vite Static Site)
3. Fill in the missing secret keys (`MONGODB_URI`, `LLM_API_KEY`, `GEMINI_API_KEY`) in the Render Dashboard when prompted.

---

## 6. Build & Test Commands

Run verification commands locally or in CI/CD pipelines before any release:

```bash
# 1. Frontend Build Verification
cd client
npm ci
npm run build

# 2. Express Backend Unit & Integration Tests (19 tests)
cd ../server
npm ci
npm test

# 3. Python RAG Service Tests (12 tests)
cd ../rag-service
pip install -r requirements.txt
python -m pytest tests/ -v
```

---

## 7. Post-Deployment Smoke Test Checklist

Execute these checks immediately following deployment:

- [ ] **Liveness**: `curl -f https://<backend-domain>/api/v1/health` returns HTTP 200 with status `ok`.
- [ ] **Readiness**: `curl -f https://<backend-domain>/api/v1/health/ready` returns HTTP 200 with database status `ok`.
- [ ] **SPA Direct Deep Linking**: Navigate directly in a browser to `https://<frontend-domain>/scenarios`, `https://<frontend-domain>/search`, and `https://<frontend-domain>/admin/documents`. Ensure the pages render without 404.
- [ ] **Adjudication Query**: In `/chat`, ask *"What happens if the ball strikes a helmet on the ground?"*. Verify that Law 28.3 citation is returned with 5 penalty runs.
- [ ] **Scenario Analyser**: Submit a scenario in `/scenarios` and verify structured ruling output.
- [ ] **Bug & Law Discrepancy Reporting**:
  - Click **Report Law / Bug** in the top navigation.
  - Test the **Send via Gmail (Web)** button — confirm it opens Gmail directly with pre-populated details.
  - Test submitting a report and inspect `/admin/documents` via **View Logged Reports** to verify database persistence.
- [ ] **Rate Limiting**: Execute 15 rapid POST requests to `/api/v1/auth/login` and verify HTTP 429 `AUTH_RATE_LIMIT_EXCEEDED` is returned.

---

## 8. Rollback & Incident Response

### Rapid Rollback
1. **Frontend**: In the Vercel or Render dashboard, go to **Deployments** -> select the previous successful release -> click **Promote to Production** (instant zero-downtime rollback).
2. **Backend**: In the Render service dashboard, click **History** -> select the previous commit -> click **Rollback to this deploy**.

### Secret Rotation Procedure
If any secret (`JWT_SECRET`, `LLM_API_KEY`, `MONGODB_URI`) is compromised:
1. **Gemini API Key**: Generate a new key in Google AI Studio, update `LLM_API_KEY` in Render dashboard, and trigger a manual redeploy. Revoke the old key.
2. **MongoDB Credentials**: In Atlas **Database Access**, add a new user password, update `MONGODB_URI` in server environment, redeploy, then delete the old user credentials.
3. **JWT Secret**: Update `JWT_SECRET` in environment variables and redeploy. (Existing sessions will expire and require users to re-login).
