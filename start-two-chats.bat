@echo off
echo Starting chat application with two user instances...
echo Note: If ports are in use, Vite will automatically use next available ports
echo.

REM Change to backend directory and start backend
echo Starting backend server...
start "Backend Server" cmd /c "cd /d %~dp0\backend && npm run dev"

REM Wait for backend to start
timeout /t 5 /nobreak > nul

REM Change to web directory and start two frontend instances
echo Starting frontend instances...
cd /d %~dp0\web

REM Start first instance (User 1)
start "Chat - User 1" cmd /c "npm run dev:user1"

REM Wait a moment
timeout /t 5 /nobreak > nul

REM Start second instance (User 2)
start "Chat - User 2" cmd /c "npm run dev:user2"

echo.
echo All services started!
echo Backend: http://localhost:3000
echo Check terminal windows for actual frontend URLs (may be 5173/5174 or next available)
echo.
echo You can now log in with different accounts in each browser window
echo and start chatting between them.
pause