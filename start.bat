@echo off
echo ========================================================
echo    Starting CricBot AI Cricket Laws Assistant
echo ========================================================

echo [1/3] Starting Python FastAPI RAG Service on port 8000...
start "CricBot - Python RAG Service (Port 8000)" cmd /k "cd /d %~dp0rag-service && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Node.js Express API on port 5000...
start "CricBot - Node.js Express Backend (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React Vite Frontend on port 5173...
start "CricBot - React Vite Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================================
echo CricBot is starting up!
echo Frontend:     http://localhost:5173
echo Backend API:  http://localhost:5000
echo Python RAG:   http://127.0.0.1:8000
echo ========================================================
