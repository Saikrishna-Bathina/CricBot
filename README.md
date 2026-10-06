# AI Cricket Laws Assistant (Using RAG)

A full-stack, production-oriented web application that answers questions about cricket laws, playing conditions, umpiring decisions, and match scenarios using Retrieval-Augmented Generation (RAG).

## Key Capabilities
- **Official RAG Chatbot**: Grounded strictly in official rulebooks (MCC Laws of Cricket & ICC Playing Conditions).
- **Match Scenario Analyser**: Step-by-step breakdown of edge-case match situations with conditional outcomes and missing-fact identification.
- **Law & Clause Search**: Search 42 Laws and playing conditions by clause number, keyword, format, and authority.
- **Interactive Law Quizzes**: Test knowledge with server-scored multiple choice questions and cited explanations.
- **Source Document Management**: Administrator pipeline to upload, parse, chunk, review, publish, and supersede official documents.
- **Traceable Citations**: Every rule claim displays clickable citations linking to the exact law clause and page reference.

## Technology Stack
- **Frontend**: React 18, Vite, JavaScript (JSX), Tailwind CSS, React Router, Lucide React, Zod
- **Backend**: Node.js, Express.js (ES Modules), Mongoose ODM, Zod, JWT, bcrypt
- **Database & Retrieval**: MongoDB Atlas (Vector Search & Text Indexes)
- **Testing**: Vitest, Supertest

## Directory Structure
```
ai-cricket-laws-assistant/
├── client/          # React + Vite frontend
├── server/          # Express.js REST API + RAG pipeline
├── docs/            # Architecture, schema, ingestion & deployment guides
├── .gitignore
└── README.md
```

## Architecture Overview

CricBot consists of 3 coordinated microservices:

1. **Python FastAPI RAG Service (`rag-service/`)**:
   - Port `8000`
   - Handles multi-strategy hybrid retrieval (semantic vector search, exact clause matching, cricket concept expansion, and Reciprocal Rank Fusion).
   - Generates verified rulings with claim-level citation validation using Gemini LLM with automatic model fallback.
2. **Node.js Express Backend (`server/`)**:
   - Port `5000`
   - Manages REST APIs, user sessions, conversation persistence in MongoDB Atlas, scenario orchestration, and quizzes.
3. **React Vite Frontend (`client/`)**:
   - Port `5173`
   - Authoritative "Cricket Laws Adjudication Console" with real-time format/competition filtering (MCC, Test, ODI, T20I, IPL), scenario analysis, and clickable citation inspection modals.

---

## Quick Start (Run All Services)

### Option A: One-Click Launch (Windows)

Double-click `start.bat` or run in PowerShell:
```powershell
.\start.ps1
```
This automatically launches all 3 services in separate terminal windows.

---

### Option B: Manual Terminal Launch (3 Terminals)

#### Terminal 1 — Python FastAPI RAG Service
```powershell
cd D:\CricBot\rag-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Health Check*: `http://127.0.0.1:8000/health`

#### Terminal 2 — Node.js Express Backend
```powershell
cd D:\CricBot\server
npm start
```
*Health Check*: `http://localhost:5000/api/v1/health/ready`

#### Terminal 3 — React Vite Frontend
```powershell
cd D:\CricBot\client
npm run dev
```
*Open in Browser*: **`http://localhost:5173`**

---

## Running Automated Tests

### Python RAG Service Tests (Pytest)
```powershell
cd D:\CricBot\rag-service
pytest
```

### Node.js Backend Tests (Vitest)
```powershell
cd D:\CricBot\server
npm test
```

