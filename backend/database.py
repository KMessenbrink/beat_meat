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
            
            # Messages table for chat system
            await db.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    username TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            await db.commit()
    
    async def add_or_update_user(self, user_id: str, name: str) -> Dict:
        """Add new user or update existing user's last seen"""
        async with aiosqlite.connect(self.db_path) as db:
            # Check if this name already exists (consolidate all clicks for this name)
            cursor = await db.execute('''
                SELECT SUM(total_clicks) FROM users WHERE name = ?
            ''', (name,))
            existing_total = (await cursor.fetchone())[0] or 0
            
            # Insert or update user
            await db.execute('''
                INSERT INTO users (id, name, total_clicks, last_seen) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET 
                    name = ?, total_clicks = ?, last_seen = CURRENT_TIMESTAMP
            ''', (user_id, name, existing_total, name, existing_total))
            
            # Remove any old duplicate entries for this name (keep only the current user_id)
            await db.execute('''
                DELETE FROM users WHERE name = ? AND id != ?
            ''', (name, user_id))
            
            await db.commit()
            
            return {
                "id": user_id,
                "name": name, 
                "clicks": existing_total
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
        """Get top users leaderboard with online status - group by name to avoid duplicates"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT name, SUM(total_clicks) as total_clicks,
                       MAX(CASE WHEN last_seen > datetime('now', '-2 minutes') THEN 1 ELSE 0 END) as is_online
                FROM users 
                WHERE total_clicks > 0
                GROUP BY name
                ORDER BY total_clicks DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = await cursor.fetchall()
            return [{"name": row[0], "clicks": row[1], "is_online": bool(row[2])} for row in rows]
    
    async def cleanup_old_data(self):
        """Clean up old click history (older than 5 minutes) and consolidate duplicate users"""
        async with aiosqlite.connect(self.db_path) as db:
            # Clean old click history
            await db.execute('''
                DELETE FROM click_history 
                WHERE clicked_at < datetime('now', '-5 minutes')
            ''')
            
            # Consolidate duplicate users by name (keep the most recent entry for each name)
            await db.execute('''
                DELETE FROM users 
                WHERE rowid NOT IN (
                    SELECT MAX(rowid) 
                    FROM users 
                    GROUP BY name
                )
            ''')
            
            # Update remaining users with consolidated click counts
            cursor = await db.execute('''
                SELECT name FROM users GROUP BY name HAVING COUNT(*) = 1
            ''')
            names = await cursor.fetchall()
            
            for (name,) in names:
                # This ensures single users have correct totals after any cleanup
                cursor = await db.execute('''
                    SELECT SUM(total_clicks) FROM users WHERE name = ?
                ''', (name,))
                total_clicks = (await cursor.fetchone())[0] or 0
                
                await db.execute('''
                    UPDATE users SET total_clicks = ? WHERE name = ?
                ''', (total_clicks, name))
            
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
    
    async def get_online_players(self) -> List[Dict]:
        """Get list of currently online players"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT name, SUM(total_clicks) as total_clicks FROM users 
                WHERE last_seen > datetime('now', '-2 minutes')
                GROUP BY name
                ORDER BY total_clicks DESC
            ''')
            
            rows = await cursor.fetchall()
            return [{"name": row[0], "clicks": row[1]} for row in rows]
    
    async def get_user_rank(self, player_name: str) -> int:
        """Get a player's current rank on the leaderboard (1-indexed)"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                WITH ranked_users AS (
                    SELECT name, SUM(total_clicks) as total_clicks,
                           ROW_NUMBER() OVER (ORDER BY SUM(total_clicks) DESC) as rank
                    FROM users 
                    WHERE total_clicks > 0
                    GROUP BY name
                )
                SELECT rank FROM ranked_users WHERE name = ?
            ''', (player_name,))
            
            result = await cursor.fetchone()
            return result[0] if result else 0
    
    async def mark_user_offline(self, user_id: str):
        """Mark a user as offline by setting their last_seen to a time in the past"""
        async with aiosqlite.connect(self.db_path) as db:
            # Set last_seen to 10 minutes ago to ensure they show as offline
            await db.execute('''
                UPDATE users 
                SET last_seen = datetime('now', '-10 minutes')
                WHERE id = ?
            ''', (user_id,))
            await db.commit()
    
    async def add_message(self, user_id: str, username: str, message: str) -> Dict:
        """Add a new chat message"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                INSERT INTO messages (user_id, username, message)
                VALUES (?, ?, ?)
            ''', (user_id, username, message.strip()[:500]))  # Limit message length
            await db.commit()
            
            # Return the message data
            return {
                "user_id": user_id,
                "username": username,
                "message": message.strip()[:500],
                "created_at": "just now"
            }
    
    async def get_recent_messages(self, limit: int = 50) -> List[Dict]:
        """Get messages from the last hour for display"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT user_id, username, message, created_at
                FROM messages
                WHERE created_at > datetime('now', '-1 hour')
                ORDER BY created_at DESC
                LIMIT ?
            ''', (limit,))
            
            rows = await cursor.fetchall()
            # Return in chronological order (oldest first for chat display)
            return [{"user_id": row[0], "username": row[1], "message": row[2], "created_at": row[3]} for row in reversed(rows)]