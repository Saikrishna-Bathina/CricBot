# CricBot — Phase 0 Baseline Report

**Date:** 2026-10-03  
**Branch:** `feature/python-rag`  
**Workspace:** `D:\CricBot`

---

## 1. Executive Summary

This report establishes the baseline status of the CricBot application before introducing the dedicated Python RAG microservice (`rag-service/`) and the official PDF knowledge base pipeline (`knowledge-base/`).

All existing frontend and backend tests pass, the live MongoDB Atlas database connection is verified, and the baseline RAG implementation achieves 100% Recall@5 and 0.929 MRR on the curated 7-scenario benchmark.

---

## 2. Existing System Architecture & Features

### 2.1 Frontend (React + Vite + Tailwind CSS)
- **Path:** `D:\CricBot\client`
- **Stack:** React 18.3, Vite 6.0, Tailwind CSS 3.4, Lucide React, React Router 6.28. Strictly JSX (no TypeScript).
- **Active Features:**
  - **Chat Interface (`/`):** Natural language cricket laws chat with format selection (All, Test, ODI, T20I), conversation history, expandable citations, and rule excerpts.
  - **Scenario Analyser (`/scenarios`):** Structured incident breakdown (Facts, Rulings, Rationale, Applicable Clauses, Next Action).
  - **Laws Search & Browser (`/laws`):** Filter by Law number, keyword, format, with full clause view.
  - **Quiz Arena (`/quiz`, `/quiz/:id`):** AI-generated 5-question law quizzes with scoring, answer explanations, and clause citations.
  - **Admin Documents (`/admin`):** Document catalog, ingestion status, document approval/rejection toggle.
  - **Authentication (`/login`):** JWT-based admin and user authentication.
  - **Citation Modal:** Displays official document source, edition, clause text, and effective dates.

### 2.2 Backend API (Node.js + Express.js + Mongoose)
- **Path:** `D:\CricBot\server`
- **Stack:** Node.js, Express 4.21, Mongoose 8.9, `@google/genai` 0.1.1, Vitest 3.2. ES modules.
- **Port:** `5000` (API prefix: `/api/v1`)
- **Endpoints:**
  - `GET  /api/v1/health` — Service health & Atlas DB connectivity
  - `POST /api/v1/auth/login` — Authentication & JWT generation
  - `GET  /api/v1/auth/me` — Current authenticated session
  - `POST /api/v1/chat` — RAG question answering with citations
  - `GET  /api/v1/chat/conversations` — User conversations list
  - `GET  /api/v1/chat/conversations/:id` — Conversation message history
  - `POST /api/v1/scenarios/analyze` — Dedicated scenario analyzer
  - `GET  /api/v1/laws/search` — Keyword and clause search
  - `GET  /api/v1/laws/browse` — Categorized law browsing
  - `POST /api/v1/quizzes/generate` — Dynamic quiz generation
  - `POST /api/v1/quizzes/:id/submit` — Quiz submission and grading
  - `GET  /api/v1/admin/documents` — Ingested documents list
  - `POST /api/v1/admin/documents/ingest` — Ingestion trigger
  - `POST /api/v1/admin/documents/:id/status` — Document approval toggle

---

## 3. Database Models (MongoDB Atlas)

The following Mongoose models are active in the live Atlas cluster:
1. `User` — Authentication, roles (`user`, `admin`, `umpire`), password hash.
2. `Document` — Official rulebooks (`title`, `edition`, `effectiveDate`, `format`, `competition`, `authority`, `status`, `checksum`, `chunkCount`).
3. `DocumentChunk` — Law-aware chunks (`documentId`, `lawNumber`, `clauseNumber`, `title`, `content`, `embedding`, `embeddingModel`, `parentLaw`, `tags`, `format`).
4. `Conversation` & `Message` — Chat history with citation IDs, model metadata, and latency.
5. `IngestionJob` & `AuditLog` — Tracking background ingestion jobs and admin actions.
6. `Quiz`, `QuizQuestion`, `QuizAttempt` — Quiz storage and attempt scoring.

---

## 4. Current RAG Pipeline & Known Accuracy Bottlenecks

### Current RAG Flow
1. Query normalization and rule/keyword extraction (`lawRegexes`, format flags).
2. Semantic retrieval via Atlas Vector Search (`$vectorSearch`), falling back to in-memory cosine similarity if vector index is building or unindexed.
3. Keyword/regex retrieval across Law titles and clause contents.
4. Reciprocal Rank Fusion (RRF) to merge candidate lists.
5. LLM Answer generation via Google Gemini (`gemini-3.8-flash`).
6. Post-generation citation validation ensuring cited IDs exist in the retrieved candidate set.

### Known Bottlenecks & Accuracy Deficiencies
1. **Unverified Text Sources:** Current knowledge base was populated from structured markdown/text seeds rather than verified page-by-page extractions from official MCC/ICC PDFs with verified hashes.
2. **Hierarchy & Playing Condition Conflicts:** When ICC Playing Conditions override an MCC Law (e.g., MCC Law 21 No Ball vs ICC T20I Clause 21.19 Free Hit, or Concussion replacement regulations), the system relies purely on text matching rather than an explicit authority/hierarchy resolver.
3. **Absence of Claim-Level Verification:** Current validation checks whether a citation ID was in the retrieved pool, but does not verify whether the exact assertion made in sentence $N$ is directly substantiated by the text of that clause.
4. **No Structural Abstention:** The current engine attempts to formulate an answer even when key scenario facts (e.g., whether the ball became dead, whether the batsman grounded their bat before a collision) are unstated or ambiguous.
5. **No PDF Provenance:** Lack of printed page numbers, section headers, or PDF page indices in citation inspect modals.

---

## 5. Verification & Test Baseline

### 5.1 Backend Vitest Results (Run on 2026-10-03)
- **Files:** 6 passed (6)
- **Tests:** 16 passed (16)
- **Duration:** 12.83s
- **Suites:**
  - `tests/integration/health.test.js`: 3 passed
  - `tests/integration/retrieval.test.js`: 3 passed
  - `tests/integration/evaluation.test.js`: 1 passed (Recall@5: 100.0%, MRR: 0.929)
  - `tests/integration/api.test.js`: 5 passed
  - `tests/unit/chunker.test.js`: 2 passed
  - `tests/unit/embeddings.test.js`: 2 passed

### 5.2 Frontend Build Results
- **Command:** `npm run build` in `client/`
- **Output:** Built cleanly in 36.2s, 1654 modules transformed, zero bundling or JSX syntax errors.

---

## 6. Migration & Rollback Strategy

1. **Feature Branch:** All Python RAG development occurs on `feature/python-rag`.
2. **Express Adapter with Dual-Mode Feature Flag:**
   - `USE_PYTHON_RAG=true`: Express routes `/api/v1/chat`, `/api/v1/scenarios/analyze`, and `/api/v1/laws/search` proxy requests to the FastAPI microservice (`http://localhost:8000`).
   - `USE_PYTHON_RAG=false` (or fallback on error): Express seamlessly executes the existing internal JS RAG pipeline with zero disruption to end users.
3. **Database Compatibility:** Python service uses shared MongoDB collection names (`documents`, `documentchunks`) and identical field naming to prevent collection drift or data duplication.
