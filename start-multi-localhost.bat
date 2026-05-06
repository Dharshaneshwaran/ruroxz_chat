@echo off
setlocal enabledelayedexpansion

REM ============================================
REM RUROXZ CHAT - Multi-Localhost Configuration
REM ============================================

echo.
echo ========================================
echo  RUROXZ CHAT - Multi-Instance Manager
echo ========================================
echo.
echo Select startup option:
echo.
echo 1. Start Full Setup (Backend + Both Frontends)
echo 2. Start Backend Only
echo 3. Start User 1 Frontend Only
echo 4. Start User 2 Frontend Only
echo 5. Start Both Frontends (requires backend running)
echo 6. Advanced Configuration
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto fullsetup
if "%choice%"=="2" goto backend_only
if "%choice%"=="3" goto user1_only
if "%choice%"=="4" goto user2_only
if "%choice%"=="5" goto both_frontends
if "%choice%"=="6" goto advanced
if "%choice%"=="7" goto end
goto invalid

REM ============================================
:fullsetup
REM ============================================
echo.
echo Starting Full Setup (Backend + Both Frontends)...
echo.
echo Starting backend server on port 3000...
start "RUROXZ - Backend Server" cmd /c "cd /d %~dp0\backend && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting User 1 frontend on port 5173...
start "RUROXZ - User 1 Instance" cmd /c "cd /d %~dp0\web && npm run dev:user1"

timeout /t 3 /nobreak > nul

echo Starting User 2 frontend on port 5174...
start "RUROXZ - User 2 Instance" cmd /c "cd /d %~dp0\web && npm run dev:user2"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend:       http://localhost:3000
echo User 1:        http://localhost:5173
echo User 2:        http://localhost:5174
echo.
echo Note: Check terminal windows for actual URLs if ports are in use
echo.
pause
goto end

REM ============================================
:backend_only
REM ============================================
echo.
echo Starting Backend Server...
echo.
start "RUROXZ - Backend" cmd /c "cd /d %~dp0\backend && npm run dev"
echo Backend started on http://localhost:3000
pause
goto end

REM ============================================
:user1_only
REM ============================================
echo.
echo Starting User 1 Frontend...
echo.
start "RUROXZ - User 1" cmd /c "cd /d %~dp0\web && npm run dev:user1"
echo User 1 starting on http://localhost:5173
pause
goto end

REM ============================================
:user2_only
REM ============================================
echo.
echo Starting User 2 Frontend...
echo.
start "RUROXZ - User 2" cmd /c "cd /d %~dp0\web && npm run dev:user2"
echo User 2 starting on http://localhost:5174
pause
goto end

REM ============================================
:both_frontends
REM ============================================
echo.
echo Starting Both Frontends (ensure backend is running on port 3000)
echo.
echo Starting User 1 frontend on port 5173...
start "RUROXZ - User 1" cmd /c "cd /d %~dp0\web && npm run dev:user1"

timeout /t 3 /nobreak > nul

echo Starting User 2 frontend on port 5174...
start "RUROXZ - User 2" cmd /c "cd /d %~dp0\web && npm run dev:user2"

echo.
echo Both frontends started!
echo User 1: http://localhost:5173
echo User 2: http://localhost:5174
echo.
pause
goto end

REM ============================================
:advanced
REM ============================================
echo.
echo ========================================
echo ADVANCED CONFIGURATION
echo ========================================
echo.
echo A. View User 1 Configuration (.env.user1)
echo B. View User 2 Configuration (.env.user2)
echo C. Edit User 1 Configuration
echo D. Edit User 2 Configuration
echo E. Custom Port Configuration
echo F. Back to Main Menu
echo.
set /p adv_choice="Enter your choice (A-F): "

if /i "%adv_choice%"=="A" (
    echo.
    echo User 1 Configuration (.env.user1):
    echo.
    type %~dp0\web\.env.user1
    echo.
    pause
    goto advanced
)

if /i "%adv_choice%"=="B" (
    echo.
    echo User 2 Configuration (.env.user2):
    echo.
    type %~dp0\web\.env.user2
    echo.
    pause
    goto advanced
)

if /i "%adv_choice%"=="C" (
    echo Opening User 1 Configuration in default editor...
    start notepad "%~dp0\web\.env.user1"
    goto advanced
)

if /i "%adv_choice%"=="D" (
    echo Opening User 2 Configuration in default editor...
    start notepad "%~dp0\web\.env.user2"
    goto advanced
)

if /i "%adv_choice%"=="E" (
    echo.
    echo Current Configuration:
    echo User 1 Port: 5173
    echo User 2 Port: 5174
    echo.
    echo To use custom ports, edit .env.user1 and .env.user2 files
    echo and change the PORT value accordingly.
    echo.
    pause
    goto advanced
)

if /i "%adv_choice%"=="F" (
    goto fullsetup
)

goto advanced

REM ============================================
:invalid
REM ============================================
echo.
echo Invalid choice. Please try again.
echo.
pause
goto fullsetup

REM ============================================
:end
REM ============================================
echo.
echo Thank you for using RUROXZ CHAT!
echo.
endlocal
