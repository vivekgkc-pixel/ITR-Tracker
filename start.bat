@echo off
echo ========================================
echo   ITR TRACKER - Starting Application
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9 or higher from https://python.org
    pause
    exit /b 1
)
echo Python found successfully

echo.
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js found successfully

echo.
echo [3/4] Setting up Backend...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing backend dependencies...
pip install -r requirements.txt -q
echo Starting backend server...
start "ITR Tracker Backend" cmd /k "python app.py"

echo.
echo [4/4] Setting up Frontend...
cd ..\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
echo Starting frontend server...
start "ITR Tracker Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Application is starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /F /FI "WINDOWTITLE eq ITR Tracker Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ITR Tracker Frontend*" >nul 2>&1
echo Servers stopped.
