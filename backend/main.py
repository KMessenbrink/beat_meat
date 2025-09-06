from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import Dict, Set
from database import BeatMeatDB

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database instance with persistent path
import os
db_path = os.getenv('DB_PATH', '/app/data/beatmeat.db')
db = BeatMeatDB(db_path)

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}
connected_users: Set[str] = set()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    
    try:
        # Wait for initial message with user name
        data = await websocket.receive_text()
        message = json.loads(data)
        
        if message["type"] == "join":
            user_name = message["name"]
            
            # Add user to database and active connections
            user_data = await db.add_or_update_user(user_id, user_name)
            connected_users.add(user_id)
            active_connections[user_id] = websocket
            
            # Get initial stats from database
            global_stats = await db.get_global_stats()
            leaderboard = await db.get_leaderboard()
            
            # Send initial stats to the user
            await websocket.send_text(json.dumps({
                "type": "initial_stats",
                "personal_clicks": user_data["clicks"],
                "global_clicks": global_stats["global_clicks"],
                "connected_users": len(connected_users),
                "leaderboard": leaderboard
            }))
            
            # Notify all users about connection count update
            await broadcast_stats()
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "click":
                # Add click to database
                click_result = await db.add_click(user_id)
                
                # Send response to clicking user
                await websocket.send_text(json.dumps({
                    "type": "click_response",
                    "personal_clicks": click_result["user_clicks"],
                    "should_smoke": click_result["should_smoke"],
                    "recent_clicks": click_result["recent_clicks"]
                }))
                
    except WebSocketDisconnect:
        connected_users.discard(user_id)
        active_connections.pop(user_id, None)
        await broadcast_stats()
    except Exception as e:
        print(f"Error in websocket for user {user_id}: {e}")
        connected_users.discard(user_id)
        active_connections.pop(user_id, None)

async def broadcast_stats():
    """Broadcast current stats to all connected users"""
    if not active_connections:
        return
    
    # Get fresh stats from database
    global_stats = await db.get_global_stats()
    leaderboard = await db.get_leaderboard()
    
    stats_message = json.dumps({
        "type": "stats_update",
        "global_clicks": global_stats["global_clicks"],
        "connected_users": len(connected_users),
        "leaderboard": leaderboard
    })
    
    # Send to all connected users
    disconnected_users = []
    for user_id, websocket in active_connections.items():
        try:
            await websocket.send_text(stats_message)
        except:
            disconnected_users.append(user_id)
    
    # Clean up disconnected users
    for user_id in disconnected_users:
        connected_users.discard(user_id)
        active_connections.pop(user_id, None)

async def periodic_stats_broadcast():
    """Broadcast stats every 1 second and clean up old data"""
    while True:
        await asyncio.sleep(1)
        await broadcast_stats()
        await db.cleanup_old_data()  # Clean up old click history

async def init_database():
    """Initialize the database"""
    await db.init_db()
    print("Database initialized successfully")

@app.on_event("startup")
async def startup_event():
    # Initialize database
    await init_database()
    
    # Start the periodic stats broadcast task
    asyncio.create_task(periodic_stats_broadcast())
    print("Backend started successfully")

@app.get("/")
async def root():
    return {"message": "Beat Meat Game Backend Running with SQLite Database"}

@app.get("/stats")
async def get_stats():
    """API endpoint to get current stats"""
    global_stats = await db.get_global_stats()
    leaderboard = await db.get_leaderboard()
    return {
        **global_stats,
        "connected_users": len(connected_users),
        "leaderboard": leaderboard
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)