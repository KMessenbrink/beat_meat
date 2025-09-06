#!/bin/bash

# Beat Meat Game Docker Setup Script

set -e

echo "🥊 Setting up Beat Meat Game with Docker..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p logs

# Ensure sounds and icons directories exist
if [ ! -d "sounds" ]; then
    echo "⚠️  Warning: sounds directory not found. Please ensure sounds/ directory exists with audio files."
fi

if [ ! -d "icons" ]; then
    echo "⚠️  Warning: icons directory not found. Please ensure icons/ directory exists with image files."
fi

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and run the containers
echo "🔨 Building Docker containers..."
docker-compose build

echo "🚀 Starting Beat Meat Game..."
docker-compose up -d

# Wait for containers to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check container status
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🎮 Beat Meat Game is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:8000"
echo ""
echo "📁 Persistent data:"
echo "   - Database: ./data/beatmeat.db"
echo "   - Sounds: ./sounds/"
echo "   - Icons: ./icons/"
echo ""
echo "🛠️  Management commands:"
echo "   - Stop:    docker-compose down"
echo "   - Restart: docker-compose restart"
echo "   - Logs:    docker-compose logs -f"
echo "   - Update:  docker-compose build && docker-compose up -d"