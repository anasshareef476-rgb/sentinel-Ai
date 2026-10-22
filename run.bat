@echo off
title SentinelAI - Launch Services
echo ========================================================
echo   SentinelAI: AI Agent Safety & Policy Gateway
echo   Team Codebuggy ^| PS 2.1 ^| DevHost 2026
echo ========================================================

start "SentinelAI Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "SentinelAI Frontend (Vite React)" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo SentinelAI services starting...
echo Backend API:  http://127.0.0.1:8000
echo Frontend SOC: http://127.0.0.1:5173
echo.
pause
