Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Starting CricBot AI Cricket Laws Assistant" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start Python RAG Service
Write-Host "[1/3] Launching Python FastAPI RAG Service (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\rag-service'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# 2. Start Express Backend
Write-Host "[2/3] Launching Node.js Express Backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm start"

Start-Sleep -Seconds 2

# 3. Start Vite Client
Write-Host "[3/3] Launching React Vite Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host "`nAll 3 CricBot services launched successfully!" -ForegroundColor Green
Write-Host "Frontend:      http://localhost:5173" -ForegroundColor White
Write-Host "Backend API:   http://localhost:5000" -ForegroundColor White
Write-Host "Python RAG:    http://127.0.0.1:8000" -ForegroundColor White
