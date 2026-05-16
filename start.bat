@echo off
setlocal
title YTauto Launcher
cd /d "%~dp0"

echo.
echo === YTauto launcher ===
echo.

if not exist "backend\.env" (
    echo [warn] backend\.env is missing - AI calls will fail until you add it.
    echo        Copy backend\.env.example to backend\.env and fill in your keys.
    echo.
)

if not exist "frontend\node_modules" (
    echo [setup] frontend\node_modules missing - running npm install once...
    pushd frontend
    call npm install
    popd
    echo.
)

echo Starting backend on http://localhost:8000 ...
start "YTauto - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload"

echo Starting frontend on http://localhost:3000 ...
start "YTauto - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Waiting for servers to warm up...
timeout /t 8 /nobreak >nul

echo Opening browser...
start "" "http://localhost:3000"

echo.
echo Launched. Two windows opened - one per server.
echo Close those windows (or press Ctrl+C in each) to stop the servers.
echo You can close this launcher window anytime.
echo.
pause
endlocal
