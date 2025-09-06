# 🐳 Beat Meat Game - Docker Deployment

Complete Docker setup for the Beat Meat multiplayer clicking game.

## 🚀 Quick Start

```bash
# Run the automated setup
./setup-docker.sh
```

**Or manually:**

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 📁 Directory Structure

```
beat_meat/
├── docker-compose.yml          # Development setup
├── docker-compose.prod.yml     # Production setup
├── setup-docker.sh            # Automated setup script
├── .env                       # Environment variables
├── backend/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
├── data/                      # 📊 Database storage (mounted)
│   └── beatmeat.db
├── sounds/                    # 🔊 Audio files (mounted)
│   ├── bg.mp3
│   ├── slap.mp3
│   ├── bouta.mp3
│   └── chum.mp3
└── icons/                     # 🖼️ Game assets (mounted)
    ├── fist.png
    └── meat.png
```

## 🔧 Services

### Backend
- **Port:** 8000
- **Technology:** Python FastAPI + WebSocket
- **Database:** SQLite (mounted to `./data/`)
- **Health Check:** `curl http://localhost:8000/`

### Frontend  
- **Port:** 3000 (dev) / 80 (prod)
- **Technology:** React + Vite + Nginx
- **Assets:** Sounds & icons mounted from host
- **Health Check:** `curl http://localhost/`

## 💾 Persistent Storage

All persistent data is mounted to the host:

### Database
```yaml
volumes:
  - ./data:/app/data  # SQLite database
```

### Assets
```yaml
volumes:
  - ./sounds:/usr/share/nginx/html/sounds:ro  # Audio files
  - ./icons:/usr/share/nginx/html/icons:ro   # Game images
```

## 🔄 Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild and restart
docker-compose build && docker-compose up -d

# Check container status
docker-compose ps

# Execute commands in container
docker-compose exec backend bash
docker-compose exec frontend sh
```

## 🌐 Production Deployment

For production use `docker-compose.prod.yml`:

```bash
# Setup production directories
sudo mkdir -p /opt/beatmeat/{data,sounds,icons,logs,ssl}
sudo cp -r sounds/* /opt/beatmeat/sounds/
sudo cp -r icons/* /opt/beatmeat/icons/

# Start production setup
docker-compose -f docker-compose.prod.yml up -d
```

### Production Volumes
- Database: `/opt/beatmeat/data`
- Sounds: `/opt/beatmeat/sounds`
- Icons: `/opt/beatmeat/icons`
- Logs: `/opt/beatmeat/logs`
- SSL: `/opt/beatmeat/ssl`

## 🔒 Security Features

- **Health Checks:** Both services have health monitoring
- **Logging:** Structured JSON logs with rotation
- **Read-Only Mounts:** Assets mounted as read-only
- **Non-Root:** Containers run with minimal privileges
- **SSL Ready:** Production setup supports HTTPS

## 📊 Monitoring

### Container Health
```bash
# Check health status
docker-compose ps

# Detailed health info
docker inspect beatmeat-backend | grep -A 5 "Health"
```

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Application logs
tail -f logs/app.log
```

### Database
```bash
# Access database
docker-compose exec backend sqlite3 /app/data/beatmeat.db

# Database queries
.tables
SELECT * FROM users LIMIT 10;
SELECT * FROM global_stats;
```

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill processes or change ports in docker-compose.yml
```

**Permission issues:**
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER data/
```

**Assets not loading:**
```bash
# Verify mounts
docker-compose exec frontend ls -la /usr/share/nginx/html/sounds/
docker-compose exec frontend ls -la /usr/share/nginx/html/icons/
```

**Database issues:**
```bash
# Reset database
rm -f data/beatmeat.db
docker-compose restart backend
```

## 🎮 Game Access

- **Local Development:** http://localhost:3000
- **Production:** http://your-domain.com
- **Backend API:** http://localhost:8000 or http://your-domain.com:8000
- **API Docs:** http://localhost:8000/docs

## 🔄 Updates

To update the game:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d

# Or use the update script
./setup-docker.sh
```

Your data, sounds, and icons will persist through updates! 🎊