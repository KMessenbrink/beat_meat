# Beat Meat - The Ultimate Punching Game
sdfdsd
A fun, interactive web game where players click a fist to punch meat and compete on a global leaderboard!

## Features

- 🥊 Click the fist to punch the meat with satisfying animations
- 🎆 Particle effects when the meat gets hit
- 🔥 Smoking effect when clicking rapidly (10+ clicks in 5 seconds)
- 📊 Real-time global statistics updated every 5 seconds
- 🏆 Live leaderboard showing top players
- 👥 Live counter of connected players
- 🌐 WebSocket-powered real-time multiplayer experience

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm

### Running the Application

1. **Start the Backend** (Terminal 1):
   ```bash
   ./start-backend.sh
   ```
   This will install Python dependencies and start the FastAPI server on http://localhost:8000

2. **Start the Frontend** (Terminal 2):
   ```bash
   ./start-frontend.sh
   ```
   This will install npm dependencies and start the React dev server on http://localhost:3000

3. **Open your browser** and go to http://localhost:3000

## How to Play

1. Enter your name when prompted
2. Click the fist icon to punch the meat
3. Watch the satisfying animations and particle effects
4. Try to get on the leaderboard by clicking more than other players
5. Click rapidly (10+ times in 5 seconds) to see the smoking effect!

## Technical Architecture

- **Backend**: Python FastAPI with WebSocket support for real-time communication
- **Frontend**: React with Vite for fast development and modern JavaScript features
- **Communication**: WebSocket connections for instant updates of stats and leaderboards
- **Styling**: Pure CSS with animations and particle effects

## Game Mechanics

- Personal click counter tracks your individual progress
- Global click counter shows total clicks from all players ever
- Leaderboard updates in real-time showing top 10 players
- Connected users counter shows how many people are playing right now
- Rapid clicking (10+ clicks in 5 seconds) triggers smoking animation
- Particle effects explode from the meat when punched

## Development

### Backend Structure
- `backend/main.py` - Main FastAPI application with WebSocket endpoints
- `backend/requirements.txt` - Python dependencies

### Frontend Structure  
- `frontend/src/App.jsx` - Main React component with game logic
- `frontend/src/index.css` - Styling and animations
- `frontend/public/icons/` - Game assets (fist.png, meat.png)

## Customization

You can easily customize the game by:
- Replacing the icon images in `frontend/public/icons/`
- Modifying animations and effects in `frontend/src/index.css`
- Adjusting game mechanics in the backend logic
- Changing the smoking effect threshold (currently 10 clicks in 5 seconds)

Enjoy beating the meat! 🥊🥩