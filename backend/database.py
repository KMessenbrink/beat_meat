import aiosqlite
import asyncio
from datetime import datetime
from typing import Dict, List, Optional

class BeatMeatDB:
    def __init__(self, db_path: str = "beatmeat.db"):
        self.db_path = db_path
        
    async def init_db(self):
        """Initialize the database with required tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Users table
            await db.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    total_clicks INTEGER DEFAULT 0,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Click history for smoking effect (last 5 minutes)
            await db.execute('''
                CREATE TABLE IF NOT EXISTS click_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Global stats
            await db.execute('''
                CREATE TABLE IF NOT EXISTS global_stats (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    total_clicks INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Initialize global stats if not exists
            await db.execute('''
                INSERT OR IGNORE INTO global_stats (id, total_clicks) VALUES (1, 0)
            ''')
            
            await db.commit()
    
    async def add_or_update_user(self, user_id: str, name: str) -> Dict:
        """Add new user or update existing user's last seen"""
        async with aiosqlite.connect(self.db_path) as db:
            # Insert or update user
            await db.execute('''
                INSERT INTO users (id, name, last_seen) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET 
                    name = ?, last_seen = CURRENT_TIMESTAMP
            ''', (user_id, name, name))
            
            # Get user stats
            cursor = await db.execute('''
                SELECT id, name, total_clicks FROM users WHERE id = ?
            ''', (user_id,))
            user_data = await cursor.fetchone()
            await db.commit()
            
            return {
                "id": user_data[0],
                "name": user_data[1], 
                "clicks": user_data[2]
            }
    
    async def add_click(self, user_id: str) -> Dict:
        """Add a click for a user and return updated stats"""
        async with aiosqlite.connect(self.db_path) as db:
            # Add click to user
            await db.execute('''
                UPDATE users SET total_clicks = total_clicks + 1, last_seen = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (user_id,))
            
            # Add to click history  
            await db.execute('''
                INSERT INTO click_history (user_id) VALUES (?)
            ''', (user_id,))
            
            # Update global stats
            await db.execute('''
                UPDATE global_stats SET 
                    total_clicks = total_clicks + 1,
                    last_updated = CURRENT_TIMESTAMP
                WHERE id = 1
            ''')
            
            # Get recent clicks (last 5 seconds) for smoking effect
            cursor = await db.execute('''
                SELECT COUNT(*) FROM click_history 
                WHERE user_id = ? AND clicked_at > datetime('now', '-5 seconds')
            ''', (user_id,))
            recent_clicks = (await cursor.fetchone())[0]
            
            # Get updated user stats
            cursor = await db.execute('''
                SELECT total_clicks FROM users WHERE id = ?
            ''', (user_id,))
            user_clicks = (await cursor.fetchone())[0]
            
            await db.commit()
            
            return {
                "user_clicks": user_clicks,
                "recent_clicks": recent_clicks,
                "should_smoke": recent_clicks >= 10
            }
    
    async def get_global_stats(self) -> Dict:
        """Get global statistics"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get global clicks
            cursor = await db.execute('''
                SELECT total_clicks FROM global_stats WHERE id = 1
            ''')
            global_clicks = (await cursor.fetchone())[0]
            
            # Get connected users count (active in last 2 minutes)
            cursor = await db.execute('''
                SELECT COUNT(*) FROM users 
                WHERE last_seen > datetime('now', '-2 minutes')
            ''')
            connected_users = (await cursor.fetchone())[0]
            
            return {
                "global_clicks": global_clicks,
                "connected_users": connected_users
            }
    
    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get top users leaderboard"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT name, total_clicks FROM users 
                WHERE total_clicks > 0
                ORDER BY total_clicks DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = await cursor.fetchall()
            return [{"name": row[0], "clicks": row[1]} for row in rows]
    
    async def cleanup_old_data(self):
        """Clean up old click history (older than 5 minutes)"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                DELETE FROM click_history 
                WHERE clicked_at < datetime('now', '-5 minutes')
            ''')
            await db.commit()
    
    async def get_user_stats(self, user_id: str) -> Optional[Dict]:
        """Get specific user statistics"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT id, name, total_clicks FROM users WHERE id = ?
            ''', (user_id,))
            user_data = await cursor.fetchone()
            
            if user_data:
                return {
                    "id": user_data[0],
                    "name": user_data[1],
                    "clicks": user_data[2]
                }
            return None