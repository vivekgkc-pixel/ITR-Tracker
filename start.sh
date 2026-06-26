#!/bin/bash

echo "========================================"
echo "  ITR TRACKER - Starting Application"
echo "========================================"
echo ""

# Check Python installation
echo "[1/4] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.9 or higher"
    exit 1
fi
echo "Python found successfully"

# Check Node.js installation
echo ""
echo "[2/4] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18 or higher"
    exit 1
fi
echo "Node.js found successfully"

# Setup Backend
echo ""
echo "[3/4] Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing backend dependencies..."
pip install -r requirements.txt -q
echo "Starting backend server..."
python app.py &
BACKEND_PID=$!
cd ..

# Setup Frontend
echo ""
echo "[4/4] Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  Application is starting..."
echo "========================================"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Opening browser in 5 seconds..."
sleep 5

# Try to open browser based on OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5173 2>/dev/null || sensible-browser http://localhost:5173 2>/dev/null
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
    start http://localhost:5173
fi

echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'; exit 0" INT TERM

wait
