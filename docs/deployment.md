# Production Deployment Guide

## Architecture
- **Frontend Host**: Vercel / Netlify / AWS S3 + CloudFront
- **Backend Host**: Render / Railway / Heroku / AWS ECS
- **Database**: MongoDB Atlas (M0/M10+ with Vector Search enabled)

## Environment Variables

### Backend (`server/.env`)
```ini
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.vercel.app
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/cricket_laws_assistant?retryWrites=true&w=majority
JWT_SECRET=use-a-strong-random-64-character-secret-key-here
JWT_EXPIRES_IN=7d

# LLM & Embeddings
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_or_openai_api_key
LLM_MODEL=gemini-1.5-flash
EMBEDDING_PROVIDER=gemini
EMBEDDING_API_KEY=your_embedding_api_key
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSIONS=768
VECTOR_INDEX_NAME=cricket_vector_index
```

### Frontend (`client/.env`)
```ini
VITE_API_BASE_URL=https://your-backend-api.onrender.com/api/v1
```

## Build & Run Commands

### Backend
```bash
cd server
npm install --production
npm run start
```

### Frontend
```bash
cd client
npm install
npm run build
# Deploy 'dist' folder
```
