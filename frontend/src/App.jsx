import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [userName, setUserName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const [tempName, setTempName] = useState('')
  const [ws, setWs] = useState(null)
  const [personalClicks, setPersonalClicks] = useState(0)
  const [globalClicks, setGlobalClicks] = useState(0)
  const [connectedUsers, setConnectedUsers] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [isPunching, setIsPunching] = useState(false)
  const [isMeatHit, setIsMeatHit] = useState(false)
  const [shouldSmoke, setShouldSmoke] = useState(false)
  const [particles, setParticles] = useState([])
  const [encouragementMessage, setEncouragementMessage] = useState('')
  const [showEncouragement, setShowEncouragement] = useState(false)
  const particleIdRef = useRef(0)
  
  // Audio pools for overlapping sound effects
  const slapAudioPool = useRef([])
  const boutaAudioPool = useRef([])
  const chumAudioPool = useRef([])
  const bgMusicRef = useRef(null)
  const audioPoolSize = 10 // Number of simultaneous sounds per type

  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9)
  }

  const encouragingMessages = [
    "BEAST MODE ACTIVATED! 🔥",
    "YOU'RE ABSOLUTELY CRUSHING IT! 💪",
    "MEAT DESTROYER SUPREME! 🥩",
    "LEGENDARY PUNCHING POWER! ⚡",
    "UNSTOPPABLE FORCE OF NATURE! 🌪️",
    "FIST OF FURY UNLEASHED! 👊",
    "MAXIMUM CARNAGE ACHIEVED! 💥",
    "EPIC MEAT BEATING SKILLS! 🏆",
    "CHAMPION OF DESTRUCTION! 👑",
    "ULTIMATE PUNCHING MACHINE! 🤖"
  ]

  const showEncouragingMessage = () => {
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
    setEncouragementMessage(randomMessage)
    setShowEncouragement(true)
    
    setTimeout(() => {
      setShowEncouragement(false)
    }, 3000)
  }

  const createAudioPools = () => {
    // Create audio pools for overlapping sounds
    slapAudioPool.current = []
    boutaAudioPool.current = []
    chumAudioPool.current = []
    
    for (let i = 0; i < audioPoolSize; i++) {
      // Slap audio pool
      const slapAudio = new Audio('beatmeat/sounds/slap.mp3')
      slapAudio.volume = 0.3
      slapAudioPool.current.push(slapAudio)
      
      // Bouta audio pool
      const boutaAudio = new Audio('beatmeat/sounds/bouta.mp3')
      boutaAudio.volume = 0.7
      boutaAudioPool.current.push(boutaAudio)
      
      // Chum audio pool
      const chumAudio = new Audio('beatmeat/sounds/chum.mp3')
      chumAudio.volume = 0.8
      chumAudioPool.current.push(chumAudio)
    }
    
    // Create background music
    bgMusicRef.current = new Audio('beatmeat/sounds/bg.mp3')
    bgMusicRef.current.volume = 0.1 // 10% volume (90% reduction from original)
    bgMusicRef.current.loop = true
    bgMusicRef.current.preload = 'auto'
    
    // Start background music (with user interaction handling)
    const startBgMusic = () => {
      if (bgMusicRef.current && bgMusicRef.current.paused) {
        bgMusicRef.current.play().then(() => {
          console.log('Background music started successfully')
        }).catch(e => {
          console.log('Background music autoplay blocked:', e.message)
        })
      }
    }
    
    // Try to start immediately (most browsers will block this)
    startBgMusic()
    
    // Start on first user interaction (this will work)
    const startOnInteraction = (e) => {
      console.log('User interaction detected, starting background music')
      startBgMusic()
      document.removeEventListener('click', startOnInteraction, true)
      document.removeEventListener('touchstart', startOnInteraction, true)
      document.removeEventListener('keydown', startOnInteraction, true)
    }
    
    // Add event listeners with capture phase to catch early
    document.addEventListener('click', startOnInteraction, true)
    document.addEventListener('touchstart', startOnInteraction, true) 
    document.addEventListener('keydown', startOnInteraction, true)
  }

  const playOverlappingSound = (audioPool, volume = 0.7) => {
    if (audioPool.current.length === 0) return
    
    // Find an available audio instance (not currently playing)
    let availableAudio = audioPool.current.find(audio => audio.paused || audio.ended)
    
    // If all are playing, use the first one (oldest sound)
    if (!availableAudio) {
      availableAudio = audioPool.current[0]
    }
    
    availableAudio.volume = volume
    availableAudio.currentTime = 0
    availableAudio.play().catch(e => console.log('Audio play failed:', e))
  }

  const playClickSounds = (clickCount) => {
    // Always play slap sound for every click (overlapping allowed)
    playOverlappingSound(slapAudioPool, 0.3)
    
    // Handle milestone sounds (overlapping allowed)
    if (clickCount % 250 === 0) {
      // 250 clicks - play chum.mp3
      setTimeout(() => playOverlappingSound(chumAudioPool, 0.8), 100)
    } else if (clickCount % 50 === 0) {
      // 50 clicks - play bouta.mp3
      setTimeout(() => playOverlappingSound(boutaAudioPool, 0.7), 150)
    }
  }

  const connectWebSocket = (name) => {
    const userId = generateUserId()
    const websocket = new WebSocket(`ws://smsandstocks.com:8000/ws/${userId}`)
    
    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        type: 'join',
        name: name
      }))
    }
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch(data.type) {
        case 'initial_stats':
          setPersonalClicks(data.personal_clicks)
          setGlobalClicks(data.global_clicks)
          setConnectedUsers(data.connected_users)
          setLeaderboard(data.leaderboard)
          break
          
        case 'stats_update':
          setGlobalClicks(data.global_clicks)
          setConnectedUsers(data.connected_users)
          setLeaderboard(data.leaderboard)
          break
          
        case 'click_response':
          setPersonalClicks(data.personal_clicks)
          setShouldSmoke(data.should_smoke)
          
          // Play sound effects
          playClickSounds(data.personal_clicks)
          
          // Show encouraging message every 50 clicks
          if (data.personal_clicks > 0 && data.personal_clicks % 50 === 0) {
            showEncouragingMessage()
          }
          
          if (data.should_smoke) {
            console.log('🔥 SMOKING ACTIVATED! Recent clicks:', data.recent_clicks)
            setTimeout(() => {
              setShouldSmoke(false)
            }, 3000)
          }
          break
      }
    }
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...')
      setTimeout(() => connectWebSocket(name), 3000)
    }
    
    setWs(websocket)
  }

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim())
      setShowNamePrompt(false)
      connectWebSocket(tempName.trim())
    }
  }

  const createParticles = () => {
    const crazyEmojis = [
      '🐒', '🐵', '🙈', '🙉', '🙊', // Monkeys
      '🎆', '🎇', '✨', '💥', '🌟', // Fireworks
      '🔥', '💨', '💢', '💫', '⭐', // Fire and effects  
      '🐐', '🐑', '🦌', '🐄', '🐮', // Goats and farm animals
      '🤯', '😵', '🥴', '😵‍💫', '🤪', // Crazy faces
      '💀', '👻', '🎃', '👽', '🤖', // Spooky stuff
      '🍖', '🥩', '🍗', '🌭', '🥓', // Meat emojis!
      '👊', '✊', '🤜', '🤛', '💪', // Fist emojis
      '🌪️', '⚡', '🌈', '☄️', '🔮', // Weather and magic
      '🎪', '🎭', '🎨', '🎯', '🎲'  // Fun stuff
    ]
    
    const newParticles = []
    const particleCount = 18 // Half the emojis for better performance
    
    // Create random emoji particles with much larger spread
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * 360) * Math.PI / 180
      const distance = 120 + Math.random() * 250 // Much further spread!
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance
      const randomEmoji = crazyEmojis[Math.floor(Math.random() * crazyEmojis.length)]
      
      newParticles.push({
        id: particleIdRef.current++,
        dx,
        dy,
        emoji: randomEmoji,
        delay: Math.random() * 300,
        rotation: Math.random() * 720 - 360 // Random spin
      })
    }
    
    // KEEP ADDING to existing particles for CHAOS!
    setParticles(prev => [...prev, ...newParticles])
    
    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)))
    }, 2000)
  }

  const handleFistClick = () => {
    if (!ws) return
    
    // Always trigger particles and send click, but don't reset animation if already punching
    createParticles()
    
    ws.send(JSON.stringify({
      type: 'click'
    }))
    
    // Only start punch animation if not already punching
    if (!isPunching) {
      setIsPunching(true)
      setIsMeatHit(true)
      
      // Reset animation after duration
      setTimeout(() => {
        setIsPunching(false)
        setIsMeatHit(false)
      }, 250)
    }
  }

  useEffect(() => {
    // Initialize audio pools for overlapping sounds
    createAudioPools()

    return () => {
      if (ws) {
        ws.close()
      }
      // Stop background music when component unmounts
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [ws])

  if (showNamePrompt) {
    return (
      <div className="name-prompt">
        <div className="name-prompt-content">
          <h2>Welcome to Beat Meat!</h2>
          <p>What's your name?</p>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Enter your name"
            maxLength={20}
          />
          <button
            onClick={handleNameSubmit}
            disabled={!tempName.trim()}
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">Your Clicks</div>
          <div className="stat-value">{personalClicks}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Global Clicks</div>
          <div className="stat-value">{globalClicks.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Players Online</div>
          <div className="stat-value">{connectedUsers}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Welcome</div>
          <div className="stat-value">{userName}</div>
        </div>
      </div>

      <div className="game-area">
        <div className={`fist-container ${shouldSmoke ? 'smoking' : ''}`}>
          <img
            src="beatmeat/icons/fist.png"
            alt="Fist"
            className={`fist-icon ${isPunching ? 'punching' : ''}`}
            onClick={handleFistClick}
          />
        </div>

        <div className="meat-container">
          <img
            src="beatmeat/icons/meat.png"
            alt="Meat"
            className={`meat-icon ${isMeatHit ? 'hit' : ''}`}
          />
          <div className="particles">
            {particles.map(particle => (
              <div
                key={particle.id}
                className="emoji-particle"
                style={{
                  '--dx': `${particle.dx}px`,
                  '--dy': `${particle.dy}px`,
                  '--rotation': `${particle.rotation || 0}deg`,
                  animationDelay: `${particle.delay || 0}ms`
                }}
              >
                {particle.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="leaderboard">
        <h3>🏆 Leaderboard</h3>
        {leaderboard.map((player, index) => (
          <div key={index} className="leaderboard-item">
            <span>
              <span className="leaderboard-rank">#{index + 1}</span>
              {player.name}
            </span>
            <span>{player.clicks}</span>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div className="leaderboard-item">
            <span>No players yet</span>
          </div>
        )}
      </div>

      {showEncouragement && (
        <div className="encouragement-message">
          {encouragementMessage}
        </div>
      )}
    </div>
  )
}

export default App