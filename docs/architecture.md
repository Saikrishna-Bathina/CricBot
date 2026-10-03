# AI Cricket Laws Assistant — Architecture Specification

## 1. System Overview
The **AI Cricket Laws Assistant** is a full-stack, production-oriented web application designed to answer questions, analyze match scenarios, and generate learning quizzes grounded in official cricket rulebooks (MCC Laws of Cricket & ICC Playing Conditions).

The system enforces strict **Retrieval-Augmented Generation (RAG)**: every factual statement regarding cricket rules is grounded in verified, retrieved source chunks and linked to traceable citations.

```
                      +-----------------------------+
                      | React 18 + Vite (Tailwind)  |
                      | Chat / Scenario / Search    |
                      +--------------+--------------+
                                     | HTTP / JSON (/api/v1)
                                     v
                      +-----------------------------+
                      | Express.js API Server (ESM) |
                      | Zod Validation & Rate Limit |
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+-------------------+      +-------------------+       +--------------------+
|  RAG Orchestrator |      |  Ingestion Worker |       |  Quiz & Scenarios  |
+--------+----------+      +---------+---------+       +---------+----------+
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
                     +---------------+---------------+
                     |  Hybrid Retrieval Pipeline    |
                     |  - Vector Search (Embeddings) |
                     |  - Clause / Law Lexical Match |
                     |  - Version & Authority Filter |
                     +---------------+---------------+
                                     |
                     +---------------+---------------+
                     |   MongoDB Atlas Database      |
                     |   - Documents & Chunks        |
                     |   - Vector & Text Indexes     |
                     |   - Quizzes & Conversations   |
                     +-------------------------------+
```

## 2. Source-Grounded Guarantee
- **No Hallucinated Rules**: Unverified claims are prohibited.
- **Traceable Citations**: Output links directly to the specific Law number, Clause number, Edition, and Page number stored in MongoDB.
- **Authority Resolution**: MCC Laws govern the universal foundation of the sport, but ICC Playing Conditions (and competition regulations like IPL/BBL/The Hundred) supersede MCC laws for specific match formats (e.g. Free Hits, DRS, Over-rate penalties). The system identifies which authority applies before responding.

## 3. Technology Stack
- **Frontend**: React 18, Vite, JavaScript (JSX), Tailwind CSS, React Router, Axios, Lucide React, Zod.
- **Backend**: Node.js (v24), Express.js, JavaScript ES Modules (`"type": "module"`), Mongoose ODM, Zod.
- **Database**: MongoDB Atlas with Vector Search and Text Indexes.
- **Testing**: Vitest, Supertest, React Testing Library.
