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
  
  // Modern audio system using Web Audio API + HTML Audio fallback
  const slapAudioPool = useRef([])
  const boutaAudioPool = useRef([])
  const chumAudioPool = useRef([])
  const bgMusicRef = useRef(null)
  const audioPoolSize = 3 // Keep it simple for all devices
  
  // Web Audio API buffers and context
  const audioContext = useRef(null)
  const audioBuffers = useRef({
    slap: null,
    bouta: null, 
    chum: null,
    bg: null
  })
  const currentAudioIndex = useRef({
    slap: 0,
    bouta: 0,
    chum: 0
  })
  
  // Detect mobile for performance optimization (keep for particle count)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

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

  // Initialize Web Audio API context
  const initializeAudioContext = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContext.current
  }
  
  // Load audio buffer for Web Audio API
  const loadAudioBuffer = async (url) => {
    try {
      const audioCtx = initializeAudioContext()
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await audioCtx.decodeAudioData(arrayBuffer)
      return buffer
    } catch (error) {
      console.log(`Failed to load audio buffer for ${url}:`, error)
      return null
    }
  }
  
  // Initialize modern audio system
  const initializeAudioSystem = async () => {
    console.log('Initializing modern audio system...')
    
    // Load audio buffers for Web Audio API
    try {
      const [slapBuffer, boutaBuffer, chumBuffer, bgBuffer] = await Promise.all([
        loadAudioBuffer('beatmeat/sounds/slap.mp3'),
        loadAudioBuffer('beatmeat/sounds/bouta.mp3'), 
        loadAudioBuffer('beatmeat/sounds/chum.mp3'),
        loadAudioBuffer('beatmeat/sounds/bg.mp3')
      ])
      
      audioBuffers.current = {
        slap: slapBuffer,
        bouta: boutaBuffer,
        chum: chumBuffer,
        bg: bgBuffer
      }
      console.log('Audio buffers loaded successfully')
    } catch (error) {
      console.log('Web Audio initialization failed, using HTML Audio fallback')
    }
    
    // Create fallback HTML Audio pools
    slapAudioPool.current = []
    boutaAudioPool.current = []
    chumAudioPool.current = []
    
    for (let i = 0; i < audioPoolSize; i++) {
      // Slap audio pool
      const slapAudio = new Audio('beatmeat/sounds/slap.mp3')
      slapAudio.preload = 'auto'
      slapAudio.volume = 0.3
      slapAudioPool.current.push(slapAudio)
      
      // Bouta audio pool
      const boutaAudio = new Audio('beatmeat/sounds/bouta.mp3')
      boutaAudio.preload = 'auto' 
      boutaAudio.volume = 0.7
      boutaAudioPool.current.push(boutaAudio)
      
      // Chum audio pool
      const chumAudio = new Audio('beatmeat/sounds/chum.mp3')
      chumAudio.preload = 'auto'
      chumAudio.volume = 0.8
      chumAudioPool.current.push(chumAudio)
    }
    
    // Background music
    bgMusicRef.current = new Audio('beatmeat/sounds/bg.mp3')
    bgMusicRef.current.volume = 0.05
    bgMusicRef.current.loop = true
    bgMusicRef.current.preload = 'auto'
    
    // Preload all HTML Audio elements
    const allAudio = [...slapAudioPool.current, ...boutaAudioPool.current, ...chumAudioPool.current, bgMusicRef.current]
    allAudio.forEach(audio => audio.load())
    
    // Start background music on first interaction
    const startOnInteraction = async () => {
      console.log('User interaction detected - starting audio system')
      
      // Resume audio context if suspended
      if (audioContext.current && audioContext.current.state === 'suspended') {
        await audioContext.current.resume()
      }
      
      // Try Web Audio API for background music first (better mobile support)
      if (audioBuffers.current.bg && audioContext.current) {
        try {
          const audioCtx = audioContext.current
          const source = audioCtx.createBufferSource()
          const gainNode = audioCtx.createGain()
          
          source.buffer = audioBuffers.current.bg
          gainNode.gain.value = 0.05
          source.loop = true
          
          source.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          source.start(0)
          
          console.log('Background music started with Web Audio API')
        } catch (error) {
          console.log('Web Audio background music failed, trying HTML Audio:', error)
          // Fallback to HTML Audio
          if (bgMusicRef.current) {
            bgMusicRef.current.play().catch(e => console.log('HTML background music failed:', e))
          }
        }
      } else {
        // Fallback to HTML Audio
        if (bgMusicRef.current) {
          bgMusicRef.current.play().catch(e => console.log('Background music failed:', e))
        }
      }
      
      // Remove listeners
      document.removeEventListener('click', startOnInteraction, true)
      document.removeEventListener('touchstart', startOnInteraction, true)
    }
    
    document.addEventListener('click', startOnInteraction, true)
    document.addEventListener('touchstart', startOnInteraction, true)
  }

  // Modern sound playing with Web Audio API + fallback
  const playSound = async (soundType, volume = 0.7) => {
    // Try Web Audio API first (best performance, especially on mobile)
    if (audioBuffers.current[soundType] && audioContext.current) {
      try {
        const audioCtx = audioContext.current
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume()
        }
        
        const source = audioCtx.createBufferSource()
        const gainNode = audioCtx.createGain()
        
        source.buffer = audioBuffers.current[soundType]
        gainNode.gain.value = volume
        
        source.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        source.start(0)
        
        return // Success - exit early
      } catch (error) {
        console.log(`Web Audio failed for ${soundType}, falling back to HTML Audio:`, error)
      }
    }
    
    // Fallback to HTML Audio API (simpler approach like lizard example)
    const audioPool = soundType === 'slap' ? slapAudioPool.current : 
                     soundType === 'bouta' ? boutaAudioPool.current : 
                     chumAudioPool.current
    
    if (audioPool.length === 0) return
    
    const currentIndex = currentAudioIndex.current[soundType]
    const audio = audioPool[currentIndex]
    
    // Simple reset and play approach (like lizard example)
    if (!audio.paused) {
      audio.pause()
    }
    audio.currentTime = 0
    audio.volume = volume
    
    try {
      await audio.play()
    } catch (error) {
      console.log(`HTML Audio failed for ${soundType}:`, error)
    }
    
    // Move to next audio instance in pool
    currentAudioIndex.current[soundType] = (currentIndex + 1) % audioPoolSize
  }

  const playClickSounds = (clickCount) => {
    // Always play slap sound for every click - highest priority
    playSound('slap', 0.3)
    
    // Handle milestone sounds
    if (clickCount % 250 === 0) {
      // 250 clicks - play chum.mp3
      setTimeout(() => playSound('chum', 0.8), 100)
    } else if (clickCount % 50 === 0) {
      // 50 clicks - play bouta.mp3  
      setTimeout(() => playSound('bouta', 0.7), 150)
    }
  }

  const connectWebSocket = (name) => {
    const userId = generateUserId()
    // Use environment variable for WebSocket URL, fallback to production
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://smsandstocks.com'
    const websocket = new WebSocket(`${wsUrl}/ws/${userId}`)
    
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
    const particleCount = isMobile ? 8 : 18 // Much fewer particles on mobile
    
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
    
    // Clean up particles after animation (shorter for mobile)
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)))
    }, 1500)
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
    // Initialize modern audio system
    initializeAudioSystem()

    return () => {
      if (ws) {
        ws.close()
      }
      // Stop background music when component unmounts
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
      // Close audio context
      if (audioContext.current) {
        audioContext.current.close()
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