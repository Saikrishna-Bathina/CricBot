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

## Quick Start (Development)

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas URI)

### 1. Server Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

### 3. Running Automated Tests
```bash
cd server
npm test
```
