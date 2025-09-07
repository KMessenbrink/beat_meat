#!/bin/bash

# Beat Meat Local Development Server
# This script starts both backend and frontend for local development

echo "🥩 Starting Beat Meat Local Development Environment..."

# Check if required directories exist
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: backend and frontend directories must exist"
    exit 1
fi

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    # Kill all background jobs started by this script
    jobs -p | xargs -r kill
    wait
    echo "✅ Development servers stopped"
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo "🔧 Starting backend server on http://localhost:8000..."
cd backend
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found in backend directory"
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
echo "📦 Installing backend dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

# Set environment variables for local development
# Create local dev database directory if it doesn't exist
mkdir -p ../dev-data
export DB_PATH="../dev-data/beatmeat-local.db"

# Start backend in background
echo "🚀 Starting FastAPI backend..."
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Error: Backend failed to start"
    exit 1
fi

echo "✅ Backend running on http://localhost:8000"

# Start frontend
cd ../frontend
echo "🔧 Starting frontend server on http://localhost:3000..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Environment variables are set in frontend/.env.local

echo "🚀 Starting Vite development server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo "❌ Error: Frontend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend running on http://localhost:3000"
echo ""
echo "🎮 Beat Meat Game is ready!"
echo "   🌐 Open http://localhost:3000/beatmeat in your browser"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📊 Backend Stats: http://localhost:8000/stats"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep script running and wait for user to stop
wait