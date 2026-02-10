@echo off
title ITeam Launcher
color 0A

echo ===================================================
echo          ITeam - Development Release
echo ===================================================
echo.
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit
)
echo Node.js is installed.
echo.

echo [1/4] Checking Server Dependencies...
cd server
if not exist node_modules (
    echo Installing Server modules...
    call npm install
) else (
    echo Server modules found.
)

echo [2/4] Starting Game Server...
start "ITeam Server (Do Not Close)" cmd /k "npm start"
cd ..

echo [3/4] Checking Client Dependencies...
cd client
if not exist node_modules (
    echo Installing Client modules...
    call npm install
) else (
    echo Client modules found.
)

echo [4/4] Starting Game Client...
echo The browser should open automatically...
start "ITeam Client" cmd /c "npm run dev"

echo.
echo ===================================================
echo Game is running!
echo Server: http://localhost:3000
echo Client: http://localhost:5173
echo.
echo Keep this window and the other command windows open.
echo ===================================================
pause
