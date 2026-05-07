@echo off
echo Starting two chat instances for testing...
echo Note: If ports 5173/5174 are in use, Vite will automatically use next available ports
echo.

REM Start first instance (User 1) in background
start "Chat - User 1" cmd /c "cd /d %~dp0 && npm run dev:user1"

REM Wait a moment for first instance to start
timeout /t 5 /nobreak > nul

REM Start second instance (User 2) in new window
start "Chat - User 2" cmd /c "cd /d %~dp0 && npm run dev:user2"

echo.
echo Both instances started!
echo Check the terminal windows for the actual URLs (may be 5173/5174 or next available ports)
echo.