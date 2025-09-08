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
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [userRank, setUserRank] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [originalTitle, setOriginalTitle] = useState('')
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [isPunching, setIsPunching] = useState(false)
  const [isMeatHit, setIsMeatHit] = useState(false)
  const [shouldSmoke, setShouldSmoke] = useState(false)
  const [particles, setParticles] = useState([])
  const [encouragementMessage, setEncouragementMessage] = useState('')
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [isDiscoMode, setIsDiscoMode] = useState(false)
  const particleIdRef = useRef(0)
  const clickTimesRef = useRef([])
  const discoTimeoutRef = useRef(null)
  
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

  const generateUserSession = (name) => {
    // Store the name in localStorage for persistence
    localStorage.setItem('beatmeat_username', name)
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_')
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
    "ULTIMATE PUNCHING MACHINE! 🤖",
    "PULVERIZING THE PROTEIN! 🍖",
    "MAKING MINCEMEAT OF MISERY! 🤬",
    "TENDERIZING THE TRUTH! ✨",
    "MEAT-A-MORPHOSIS COMPLETE! 🐛",
    "THIS MEAT'S HAD A MEATING! 🤝",
    "FISTED TO PERFECTION! 👌",
    "UNYIELDING MEAT-RELATED FURY! 😡",
    "SMASHING SUCCESS! 🔨",
    "PORK-FECT PERFORMANCE! 🐷",
    "FISTFUL OF MEAT-TASTIC! 🤩",
    "A WHOLE-SOME WHOPPING! 🍔",
    "PUTTING THE PRO IN PROTEIN! 🍳",
    "MEAT TO YOUR HEEL! 🐾",
    "WHACKING IT HARD! 🪵",
    "POUNDING POWERHOUSE! 💪",
    "MEAT-ING YOUR DEMANDS! 🙋‍♀️",
    "KNUCKLING UP FOR KNUCKLES! 👊",
    "BEEF'S WHAT'S FOR DINNER! 🥩",
    "POUNDING IT OUT! 🥁",
    "A CUT ABOVE THE REST! 🔪",
    "MASTERFUL MEAT PULVERIZER! 👨‍🍳",
    "TENDERIZING THE TIMBER! 🌳",
    "MEAT BEAT MANIA! 🤸‍♂️",
    "FISTING FOR FREEDOM! 🗽",
    "GIVING IT THE OLD POUNDAROONEY! 💰",
    "THIS MEAT'S ABOUT TO GET MEAT-IER! 🥩",
    "FISTING THE FAT! 🥓",
    "A MEATY VICTORY! 🎉",
    "HULK SMASH MEAT! 💚",
    "MEAT AND GREET THE GROUND! 👋",
    "SOCKING IT TO THE SUCCOTASH! 🌽",
    "PUNCHING PROUDLY! 🦁",
    "MEAT MASHING MARVEL! 🌟",
    "A FISTFUL OF FLAVOR! 😋",
    "YOU'RE A MEAT-OR! ☄️",
    "MEAT THE CLOCK! ⏰",
    "FISTING FOR FAME! 🏆",
    "KNUCKLE SANDWICH SERVED! 🥪",
    "BRINGING HOME THE BACON! 🥓",
    "A BATCH OF BEATEN MEAT! 👨‍🍳",
    "FISTING FOR FULFILLMENT! 🙏",
    "PORKIN' IT HARD! 🐖",
    "YOUR FISTS ARE FIERCE! 🔥",
    "MEAT THE MOMENT! 🕰️",
    "PUNCHING PURE POWER! 🔋",
    "FISTING THE FROZEN! 🧊",
    "MEAT-ING YOU HALFWAY! 🚶‍♂️",
    "KNUCKLING DOWN! 👊",
    "A MEAT-TASTIC JOB! 💯",
    "POUNDING OUT THE PROBLEMS! 🤬",
    "PULVERIZING MEAT LIKE A MAD BUTCHER! 🔪",
    "YOUR FISTS ARE MEAT’S WORST NIGHTMARE! 😈",
    "SMASHING STEAKS INTO OBLIVION! 🍖",
    "FIST-FLINGING MEAT-MASHING MANIAC! 🦵",
    "TURNING TENDERLOIN TO TENDER-GONE! 💨",
    "CARNIVOROUS CARNAGE KING! 🦁",
    "BEATING MEAT LIKE IT OWES YOU MONEY! 💸",
    "HAMMERING HAMS INTO ANOTHER DIMENSION! 🌌",
    "SLAMMING SIRLOIN WITH SAVAGE STYLE! 🥊",
    "FIST-BUMPING BEEF TO BITS! ✊",
    "MEAT-ANNIHILATING MADNESS UNLEASHED! 💣",
    "PUNCHING PORK INTO THE NEXT GALAXY! 🚀",
    "GRINDING GROUND BEEF INTO DUST! 🪓",
    "YOUR HANDS ARE MEAT’S DOOMSDAY! ☠️",
    "WRECKING RIBS WITH RELENTLESS RAGE! 🛠️",
    "SMACKING SAUSAGE INTO SUBMISSION! 🥓",
    "FIST-FUELED MEAT MASSACRE! 🩸",
    "TENDERIZING T-BONES LIKE A TITAN! 🦖",
    "BASHING BRISKET WITH BRUTAL FORCE! 🔨",
    "MEAT MEETS ITS MATCH IN YOUR MITTS! 🧤",
    "CRUSHING CUTLETS WITH COSMIC POWER! 🌠",
    "PUMMELING PATTIES INTO PANCAKES! 🥞",
    "YOUR PUNCHES ARE PURE MEAT MAYHEM! 🌀",
    "SLAUGHTERING SLABS WITH SWAGGER! 😎",
    "FISTS OF FLAVOR-DEATH-DEALING FURY! 🍴",
    "ANNIHILATING NY STRIP WITH NO MERCY! 🗡️",
    "BEATING BEEF LIKE A DRUM SOLO! 🥁",
    "TURNING TRI-TIP INTO TRI-TRASH! 🗑️",
    "MEAT-MULCHING MONSTER ON THE LOOSE! 👹",
    "PUNCHING PORKCHOPS INTO PULP! 🍎",
    "YOUR HANDS ARE A MEAT APOCALYPSE! 🌋",
    "SMASHING SHANKS WITH SHOCKING SKILL! ⚡",
    "FISTING FILET MIGNON TO FINE DUST! 💨",
    "RULING THE ROAST WITH RUTHLESS HITS! 👑",
    "DEMOLISHING DRUMSTICKS WITH DELIGHT! 🍗",
    "YOUR PUNCHES ARE MEAT’S FINAL BOSS! 🎮",
    "GRILLING GROUND MEAT WITH FIST-FIRE! 🔥",
    "BLASTING BACON INTO BACON BITS! 🥓",
    "MEAT-MASHING MAESTRO OF MAYHEM! 🎶",
    "FIST-SMACKING STEAKS TO STARDUST! ✨",
    "CHOPPING CHOPS WITH CHAOTIC CHOPS! 🪚",
    "YOUR HANDS ARE MEAT’S KRYPTONITE! 🪨",
    "PULVERIZING PRIME CUTS TO PURE CHAOS! 🌪️",
    "SLAYING SLICES WITH SUPREME SWAG! 😈",
    "FIST-BLASTING BEEF INTO ETERNITY! 🕳️",
    "MEAT-MELTING MONARCH OF MADNESS! 👺",
    "SMACKING SIZZLE INTO SILENCE! 🤫",
    "YOUR PUNCHES ARE A MEAT APOCALYPSE! 💥",
    "WHACKING THAT MEAT WITH WICKED RHYTHM! 🥁",
    "TENDERIZING WITH TANTALIZING TEMPO! 💃",
    "FIST-PUMPING YOUR WAY TO MEAT GLORY! 🙌",
    "SLAPPING THAT SAUSAGE WITH SASS! 😏",
    "BEATING THE MEAT LIKE IT’S DATE NIGHT! 🌙",
    "GRINDING THAT CUT WITH GIDDY GUSTO! 😜",
    "YOUR HANDS ARE MEAT’S NAUGHTY NEMESIS! 😈",
    "POUNDING PORK WITH PLAYFUL PRECISION! 🎯",
    "SMACKING THAT SLAB WITH SOLO STYLE! 😉",
    "TURNING MEAT INTO A HOT MESS! 🔥",
    "WHACKING THAT MEAT WITH WILD ABANDON! 😜",
    "SLAPPING THE SLAB LIKE IT’S FRIDAY NIGHT! 🌟",
    "POUNDING THAT CUT WITH PURE PASSION! 💥",
    "YOUR FISTS ARE MEAT’S NAUGHTY NIGHTMARE! 😈",
    "TENDERIZING WITH TEMPTING TENACITY! 💦",
    "SMACKING THAT SAUSAGE WITH SAUCY FLAIR! 😏",
    "BEATING THE BEEF LIKE IT’S PERSONAL! 👊",
    "GRINDING THAT MEAT WITH GLEEFUL GUSTO! 😄",
    "FIST-PUMPING PORK INTO PURE CHAOS! 🎉",
    "YOUR HANDS ARE MEAT’S SINFUL SENSATION! 🔥",
    "SLAPPING THAT MEAT WITH SIZZLING SWAG! 😎",
    "POUNDING THE PORK LIKE IT’S PARTY TIME! 🎉",
    "YOUR FISTS ARE MEAT’S NAUGHTY NEMESIS! 😈",
    "WHACKING THAT SLAB WITH WICKED RHYTHM! 🥁",
    "TENDERIZING WITH TANTALIZING FURY! 💦",
    "SMACKING SAUSAGE WITH SAUCY STYLE! 😏",
    "BEATING THE BEEF WITH BEDROOM BRAVADO! 🔥",
    "GRINDING THAT CUT WITH GIDDY GUSTO! 😜",
    "FIST-PUMPING PORK INTO PURE PANDEMONIUM! 💥",
    "YOUR HANDS ARE MEAT’S MIDNIGHT FANTASY! 🌙",
    "THRASHING THAT TENDERLOIN WITH THRILL! ⚡",
    "SLAMMING STEAK WITH STEAMY SPUNK! 😘",
    "PULVERIZING PATTIES WITH PLAYFUL PASSION! 💖",
    "YOUR PUNCHES ARE MEAT’S GUILTY PLEASURE! 😈",
    "WHIPPING THAT BRISKET INTO A FRENZY! 🪢",
    "SMASHING SLABS WITH SINFUL SKILL! 😇",
    "BEATING THAT CUT LIKE IT’S DATE NIGHT! 💋",
    "FISTING FILET WITH FLIRTATIOUS FLAIR! 😉",
    "GRINDING GROUND MEAT WITH GLEEFUL GRACE! ✨",
    "YOUR HANDS TURN MEAT INTO A HOT MESS! 🔥",
    "PUMMELING PORKCHOPS WITH PURE PIZZAZZ! 🌟",
    "SLAPPING SIRLOIN WITH SCANDALOUS SPEED! 🏃",
    "TENDERIZING WITH TEMPTING TENACITY! 💦",
    "YOUR FISTS ARE MEAT’S FORBIDDEN DREAM! 😴",
    "WHACKING THAT SHANK WITH WILD WHIMSY! 🎠",
    "BEATING BEEF LIKE IT’S AFTER HOURS! 🕒",
    "SMACKING SAUSAGE WITH SLY SEDUCTION! 😘",
    "POUNDING THAT ROAST WITH RACY RHYTHM! 🎶",
    "YOUR PUNCHES ARE MEAT’S NAUGHTY NIGHTMARE! 😱",
    "GRINDING THAT SLICE WITH GUTSY GLAM! 💃",
    "FIST-BUMPING BEEF INTO A FEVER PITCH! 🥊",
    "SLAMMING STEAK WITH SULTRY SWAGGER! 😎",
    "TENDERIZING T-BONES WITH TINGLING THRILL! ⚡",
    "YOUR HANDS ARE MEAT’S SPICY SECRET! 🌶️",
    "WHACKING THAT CUT WITH WINKING WIT! 😉",
    "POUNDING PORK WITH PULSE-POUNDING PASSION! 💓",
    "SMASHING SLABS WITH SNEAKY SPARKLE! ✨",
    "BEATING THAT BRISKET WITH BRAZEN BOLDNESS! 💪",
    "YOUR FISTS TURN MEAT INTO A WILD RIDE! 🎢",
    "SLAPPING SAUSAGE WITH SAUCY SASS! 😏",
    "GRINDING GROUND MEAT WITH GLEEFUL GRIT! 😄",
    "PUMMELING PATTIES WITH PLAYFUL PROWESS! 🎯",
    "YOUR PUNCHES ARE MEAT’S TABOO TANGO! 💃",
    "WHIPPING THAT ROAST INTO A RISQUÉ RUSH! 🏎️",
    "SMACKING SIRLOIN WITH SINFUL SWANK! 😈",
    "BEATING BEEF WITH BACKROOM BRIO! 🔥",
    "FISTING FILET WITH FEISTY FERVOR! 👊",
    "YOUR HANDS MAKE MEAT MELT IN MAYHEM! 💥",
    "SLAMMING SHANKS WITH SHAMELESS SHOW! 🌟",
    "POUNDING PORKCHOPS WITH PURE PERVY PANACHE! 😜",
    "BONE-SHAKING MEATQUAKE! 🌋",
    "PUNCH LEVEL: BANANA PEEL MASTER! 🍌",
    "THE MEAT CAN’T EVEN FILE TAXES ANYMORE! 🧾",
    "HOLY GUACAMOLE, YOU’RE A MEAT TORNADO! 🥑🌪️",
    "ABSOLUTE SAUSAGE SLAYER! 🌭",
    "THE MEAT CALLED ITS MOM, IT’S DONE! 📞😭",
    "YOU’RE OFFICIALLY A CHICKEN NUGGET WIZARD! 🧙‍♂️🍗",
    "KABOOM! THAT MEAT JUST JOINED THE CIRCUS! 🎪",
    "MEAT STATUS: DEMOLISHED LIKE A PIÑATA! 🎉",
    "YOU PUNCHED THE FLAVOR RIGHT OUT OF IT! 🤯",
    "THE MEAT IS APPLYING FOR WITNESS PROTECTION! 🕶️",
    "FISTS STRONGER THAN GRANDMA’S MEATLOAF! 🥘",
    "THE COWS ARE TELLING LEGENDS ABOUT YOU! 🐄📖",
    "YOU’RE THE OFFICIAL MINISTER OF MEAT BEATERY! 🏛️",
    "PUNCH POWER OVER 9000! 🔋",
    "MEAT SAID 'OUCH' IN 7 DIFFERENT LANGUAGES! 🌍",
    "YOU’RE A BEEF BOSS WITH EXTRA CHEESE! 🍔🧀",
    "THE MEAT JUST RAGE-QUIT! 🎮😤",
    "GALACTIC HAMMERFIST FROM SPACE! 🚀👊",
    "CONGRATS, YOU’VE UNLOCKED SECRET SPAGHETTI MODE! 🍝✨"
  ]

  const showEncouragingMessage = () => {
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
    setEncouragementMessage(randomMessage)
    setShowEncouragement(true)
    
    setTimeout(() => {
      setShowEncouragement(false)
    }, 3000)
  }

  // Detect rapid clicking for disco mode
  const checkForDiscoMode = () => {
    const now = Date.now()
    clickTimesRef.current.push(now)
    
    // Keep only clicks from the last 2 seconds
    clickTimesRef.current = clickTimesRef.current.filter(time => now - time <= 2000)
    
    // If 5+ clicks in 2 seconds, activate disco mode!
    if (clickTimesRef.current.length >= 5) {
      if (!isDiscoMode) {
        console.log('🕺 DISCO MEAT BEATING MODE ACTIVATED! 🕺')
        setIsDiscoMode(true)
      }
      
      // Clear any existing timeout and set a new one
      if (discoTimeoutRef.current) {
        clearTimeout(discoTimeoutRef.current)
      }
      
      // Turn off disco mode after 5 seconds of no rapid clicking
      discoTimeoutRef.current = setTimeout(() => {
        setIsDiscoMode(false)
        console.log('🎵 Disco mode deactivated after 5 seconds')
        discoTimeoutRef.current = null
      }, 5000)
    } else if (isDiscoMode) {
      // If we're in disco mode but clicks are slowing down, turn it off
      if (discoTimeoutRef.current) {
        clearTimeout(discoTimeoutRef.current)
      }
      setIsDiscoMode(false)
      console.log('🎵 Disco mode deactivated - slow clicking detected')
      discoTimeoutRef.current = null
    }
  }

  // Initialize Web Audio API context
  const initializeAudioContext = () => {
    if (!audioContext.current || audioContext.current.state === 'closed') {
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
      console.error(`Failed to load audio buffer for ${url}:`, error)
      return null
    }
  }
  
  // Initialize modern audio system
  const initializeAudioSystem = async () => {
    // Load audio buffers for Web Audio API
    try {
      const [slapBuffer, boutaBuffer, chumBuffer, bgBuffer] = await Promise.all([
        loadAudioBuffer('/beatmeat/sounds/slap.mp3'),
        loadAudioBuffer('/beatmeat/sounds/bouta.mp3'), 
        loadAudioBuffer('/beatmeat/sounds/chum.mp3'),
        loadAudioBuffer('/beatmeat/sounds/bg.mp3')
      ])
      
      audioBuffers.current = {
        slap: slapBuffer,
        bouta: boutaBuffer,
        chum: chumBuffer,
        bg: bgBuffer
      }
    } catch (error) {
      console.error('Web Audio initialization failed, using HTML Audio fallback:', error)
    }
    
    // Create fallback HTML Audio pools
    slapAudioPool.current = []
    boutaAudioPool.current = []
    chumAudioPool.current = []
    
    for (let i = 0; i < audioPoolSize; i++) {
      // Slap audio pool
      const slapAudio = new Audio('/beatmeat/sounds/slap.mp3')
      slapAudio.preload = 'auto'
      slapAudio.volume = 0.3
      slapAudioPool.current.push(slapAudio)
      
      // Bouta audio pool
      const boutaAudio = new Audio('/beatmeat/sounds/bouta.mp3')
      boutaAudio.preload = 'auto' 
      boutaAudio.volume = 0.7
      boutaAudioPool.current.push(boutaAudio)
      
      // Chum audio pool
      const chumAudio = new Audio('/beatmeat/sounds/chum.mp3')
      chumAudio.preload = 'auto'
      chumAudio.volume = 0.8
      chumAudioPool.current.push(chumAudio)
    }
    
    // Background music
    bgMusicRef.current = new Audio('/beatmeat/sounds/bg.mp3')
    bgMusicRef.current.volume = 0.05
    bgMusicRef.current.loop = true
    bgMusicRef.current.preload = 'auto'
    
    // Preload all HTML Audio elements
    const allAudio = [...slapAudioPool.current, ...boutaAudioPool.current, ...chumAudioPool.current, bgMusicRef.current]
    allAudio.forEach(audio => audio.load())
    
    // Start background music on first interaction
    const startOnInteraction = async () => {
      
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
    if (audioBuffers.current[soundType]) {
      try {
        // Ensure we have a valid AudioContext
        const audioCtx = initializeAudioContext()
        
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume()
        } else if (audioCtx.state === 'closed') {
          throw new Error('AudioContext closed')
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
        // Fall back to HTML Audio on Web Audio failure
      }
    }
    
    // Fallback to HTML Audio API (simpler approach like lizard example)
    const audioPool = soundType === 'slap' ? slapAudioPool.current : 
                     soundType === 'bouta' ? boutaAudioPool.current : 
                     chumAudioPool.current
    
    if (audioPool.length === 0) return
    
    const currentIndex = currentAudioIndex.current[soundType]
    const audio = audioPool[currentIndex]
    
    // Simple reset and play approach
    if (!audio.paused) {
      audio.pause()
    }
    audio.currentTime = 0
    audio.volume = volume
    
    try {
      await audio.play()
    } catch (error) {
      console.error(`Audio playback failed for ${soundType}:`, error)
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
    const userId = generateUserSession(name)
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
          setUserRank(data.user_rank || 0)
          setMessages(data.recent_messages || [])
          break
          
        case 'stats_update':
          setGlobalClicks(data.global_clicks)
          setConnectedUsers(data.connected_users)
          setLeaderboard(data.leaderboard)
          break
          
        case 'click_response':
          setPersonalClicks(data.personal_clicks)
          setShouldSmoke(data.should_smoke)
          setUserRank(data.user_rank || 0)
          
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
          
        case 'new_message':
          setMessages(prev => [...prev, {
            username: data.username,
            message: data.message,
            created_at: data.created_at
          }])
          
          // Only increment unread if chat is closed
          if (!showChat) {
            setUnreadCount(prev => {
              const newCount = prev + 1
              // Update document title with unread count
              document.title = `(${newCount}) Beat Meat - Click the Meat!`
              return newCount
            })
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

  const sendMessage = () => {
    if (!ws || !newMessage.trim()) return
    
    ws.send(JSON.stringify({
      type: 'message',
      message: newMessage.trim()
    }))
    
    setNewMessage('')
  }

  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const toggleChat = () => {
    const newShowChat = !showChat
    setShowChat(newShowChat)
    
    // When opening chat, reset unread count and restore title
    if (newShowChat) {
      setUnreadCount(0)
      document.title = originalTitle || 'Beat Meat - Click the Meat!'
    }
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
    
    // Check for disco mode on every click!
    checkForDiscoMode()
    
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
    // Store original document title
    setOriginalTitle(document.title)
    
    // Initialize modern audio system
    initializeAudioSystem()
    
    // Check if user has a stored name from previous session
    const storedName = localStorage.getItem('beatmeat_username')
    if (storedName) {
      setUserName(storedName)
      setTempName(storedName)
      setShowNamePrompt(false)
      connectWebSocket(storedName)
    }

    return () => {
      if (ws) {
        ws.close()
      }
      // Stop background music when component unmounts
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
      // Clear disco timeout
      if (discoTimeoutRef.current) {
        clearTimeout(discoTimeoutRef.current)
      }
      // DON'T close audio context during development (causes issues)
      // Only close on actual app shutdown
      // if (audioContext.current) {
      //   audioContext.current.close()
      // }
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
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
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
    <div className={`game-container ${isDiscoMode ? 'disco-mode' : ''}`}>
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">Your Clicks</div>
          <div className="stat-value">{personalClicks}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Global Clicks</div>
          <div className="stat-value">{globalClicks.toLocaleString()}</div>
        </div>
        <div className="stat-item" onClick={() => setShowOnlineOnly(!showOnlineOnly)} style={{cursor: 'pointer'}}>
          <div className="stat-label">Who's beatin?</div>
          <div className="stat-value">{connectedUsers}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Your Rank</div>
          <div className="stat-value">#{userRank || '?'}</div>
        </div>
      </div>

      <div className="game-area">
        <div className={`fist-container ${shouldSmoke ? 'smoking' : ''}`}>
          <img
            src="/beatmeat/icons/fist.png"
            alt="Fist"
            className={`fist-icon ${isPunching ? 'punching' : ''}`}
            onClick={handleFistClick}
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
            onSelectStart={(e) => e.preventDefault()}
          />
        </div>

        <div className="meat-container">
          <img
            src="/beatmeat/icons/meat.png"
            alt="Meat"
            className={`meat-icon ${isMeatHit ? 'hit' : ''}`}
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
            onSelectStart={(e) => e.preventDefault()}
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

      {/* Leaderboard Toggle */}
      <div className="leaderboard-toggle" onClick={() => setShowLeaderboard(!showLeaderboard)}>
        📊 {showLeaderboard ? 'Hide' : 'Show'} Board
      </div>

      {showLeaderboard && (
        <div className="leaderboard">
          <h3>🏆 {showOnlineOnly ? 'Online Players' : 'Leaderboard'}</h3>
        {(showOnlineOnly ? leaderboard.filter(player => player.is_online) : leaderboard).map((player, index) => (
          <div key={index} className="leaderboard-item">
            <span>
              <span className="leaderboard-rank">#{index + 1}</span>
              {player.name}
              {player.is_online && <span className="online-indicator">🟢</span>}
            </span>
            <span>{player.clicks}</span>
          </div>
        ))}
        {(showOnlineOnly ? leaderboard.filter(player => player.is_online) : leaderboard).length === 0 && (
          <div className="leaderboard-item">
            <span>{showOnlineOnly ? 'No online players' : 'No players yet'}</span>
          </div>
        )}
        </div>
      )}

      {/* Chat System */}
      <div className="chat-toggle" onClick={toggleChat}>
        💬 Chat {unreadCount > 0 && `(${unreadCount})`}
      </div>
      
      {showChat && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>💬 Meat Beater Chat</h3>
            <button onClick={() => setShowChat(false)}>×</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="chat-message">
                <span className="chat-username">{msg.username}:</span>
                <span className="chat-text">{msg.message}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="chat-empty">No messages yet. Be the first to chat!</div>
            )}
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleMessageKeyPress}
              placeholder="Type a message..."
              maxLength={500}
              className="chat-input"
            />
            <button onClick={sendMessage} className="chat-send-btn">Send</button>
          </div>
        </div>
      )}

      {showEncouragement && (
        <div className="encouragement-message">
          {encouragementMessage}
        </div>
      )}
    </div>
  )
}

export default App