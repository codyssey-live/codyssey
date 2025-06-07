import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useRoom } from '../context/RoomContext';
import { useNotification } from '../context/NotificationContext';
import socket from '../socket';
import { loadLectureMessages, saveLectureMessages } from '../utils/lectureRoomChatPersistence';
import { fetchAllNotes, createNote, deleteNote as deleteNoteAPI } from '../utils/noteApiUtils';
import { format } from 'date-fns';
import { AnimatePresence } from 'framer-motion';

// A small delay to ensure operations don't conflict
const SYNC_DELAY = 300;

const LectureRoom = () => {
  const location = useLocation();
  const { roomData } = useRoom();
  const [videoUrl, setVideoUrl] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const { addNotification } = useNotification();
  
  // State for note deletion confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  
  // YouTube player instance
  const playerRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);  // Flag to prevent infinite loops
  const videoIdRef = useRef(null);
  const hasJoinedVideoRoom = useRef(false);
  const wasPlayingBeforeTabChange = useRef(false);

  // Add state for notes functionality
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  
  // Add state for notes sorting and pagination
  const [sortCriteria, setSortCriteria] = useState('newest'); // 'newest', 'oldest', 'videoTitle'
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5; // Number of notes to display per page
  
  // Get username from localStorage     // Enhanced initialization with improved user status verification and socket handling
  useEffect(() => {
    const savedUsername = localStorage.getItem('roomUsername') || 'User';
    setUserName(savedUsername);
    
    // Check if user is a room creator from history with more reliable checks
    if (roomData.roomId) {
      const creatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
      const isCreatorFromSession = localStorage.getItem(`roomCreator_${roomData.roomId}`) === 'true';
      
      if ((creatorHistory[roomData.roomId] === true || isCreatorFromSession) && !roomData.isRoomCreator) {
        console.log("Found creator status in history, updating room context");
        setRoomData(prev => ({...prev, isRoomCreator: true}));
      }
      
      // If we are the creator, make sure it's saved for future sessions
      if (roomData.isRoomCreator) {
        localStorage.setItem(`roomCreator_${roomData.roomId}`, 'true');
        
        // Update creator history
        const updatedCreatorHistory = {...creatorHistory, [roomData.roomId]: true};
        localStorage.setItem('roomCreatorHistory', JSON.stringify(updatedCreatorHistory));
      }
    }
    
    // Connect the socket if not already connected with improved handling
    if (!socket.connected) {
      console.log("Socket not connected, connecting now...");
      socket.connect();
      
      socket.on('connect', () => {
        setIsConnected(true);
        console.log(`Connected to socket server with ID: ${socket.id}`);
        
        // If in a room with video, try joining automatically after connection
        if (roomData.inRoom && roomData.roomId && videoIdRef.current) {
          setTimeout(() => joinVideoRoom(), 1000);
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error("Socket connection error:", error);
        // Add system message for the error
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          user: 'System',
          text: `Connection error: ${error.message}. Trying to reconnect...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'system'
        }]);
      });
    } else {
      setIsConnected(true);
    }
    
    // Fetch all notes for the user regardless of video
    fetchUserNotes();
    
    // Cleanup socket connection
    return () => {
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [roomData.roomId, roomData.isRoomCreator]);
  
  // Fetch all notes for the current user
  const fetchUserNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const response = await fetchAllNotes();
      if (response.success) {
        console.log('Fetched notes:', response.data);
        setSavedNotes(response.data);
      } else {
        console.error('Failed to fetch notes:', response.message);
        addNotification('Failed to load notes', "error");
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      addNotification('Error loading notes', "error");
    } finally {
      setIsLoadingNotes(false);
    }
  };
  
  // Handle video URL from location state
  useEffect(() => {
    if (location.state && location.state.videoLink) {
      const link = location.state.videoLink;
      setVideoUrl(link);
      
      // Extract videoId from URL for room joining
      const videoId = extractVideoId(link);
      videoIdRef.current = videoId;
      
      // Try to get video title
      if (playerRef.current && typeof playerRef.current.getVideoData === 'function') {
        try {
          const videoData = playerRef.current.getVideoData();
          setVideoTitle(videoData.title);
        } catch (error) {
          console.error('Error getting video title:', error);
        }
      }
      
      // If we're in a room and have a video ID, try to automatically join the video room
      if (roomData.inRoom && roomData.roomId && videoId && socket.connected) {
        console.log('Auto-joining video room on navigation');
        setTimeout(() => joinVideoRoom(), 1000); // Small delay to ensure everything is initialized
      }
    }
  }, [location, roomData.inRoom, roomData.roomId, socket.connected]);
  
  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Match standard YouTube, youtu.be and YouTube playlist URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      // Standard video ID
      return `https://www.youtube.com/embed/${match[2]}?enablejsapi=1`;
    } else if (match && match[1].includes('list=')) {
      // Playlist
      return `https://www.youtube.com/embed/videoseries?list=${match[2]}&enablejsapi=1`;
    }
    
    return url;
  };
  
  // Load YouTube IFrame API
  useEffect(() => {
    // Load the YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      // Define the onYouTubeIframeAPIReady callback
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API ready');
        if (videoIdRef.current) {
          initializePlayer(videoIdRef.current);
        }
      };
    } else if (window.YT && window.YT.Player && videoIdRef.current) {
      // If the API is already loaded, initialize immediately
      initializePlayer(videoIdRef.current);
    }
    
    return () => {
      // Clean up the global callback
      window.onYouTubeIframeAPIReady = null;
    };  }, [videoUrl]);
  
  // Helper to convert YouTube error codes to readable messages
  const getYoutubeErrorMessage = (errorCode) => {
    switch(errorCode) {
      case 2: return 'Invalid video ID';
      case 5: return 'Video cannot be played in the player';
      case 100: return 'Video not found or removed';
      case 101: 
      case 150: return 'Video owner does not allow embedding';
      default: return 'Unknown error';
    }
  };
  
  // Initialize the YouTube player
  const initializePlayer = (videoId) => {
    if (!videoId) return;
    
    console.log('Initializing YouTube player with ID:', videoId);
    
    // Wait for the element to exist
    const checkElement = setInterval(() => {
      const container = document.getElementById('youtube-player');
      
      if (container) {
        clearInterval(checkElement);
        
        try {
          // Clear container first in case of re-initialization
          container.innerHTML = '';
            // Create the player with optimized settings for better sync and access control
          const player = new window.YT.Player('youtube-player', {
            height: '600',
            width: '100%',
            videoId: videoId,
            playerVars: {
              'autoplay': 0, // Don't autoplay until creator starts
              // Show controls for the creator, but guests will have them visually disabled via CSS
              'controls': roomData.isRoomCreator ? 1 : 0,
              'rel': 0,
              'fs': roomData.isRoomCreator ? 1 : 0, // Fullscreen only for creator
              'modestbranding': 1,
              'enablejsapi': 1,
              'origin': window.location.origin,
              'playsinline': 1, // Better for mobile sync
              'iv_load_policy': 3, // Hide annotations for cleaner look
              'start': 0, // Always start at beginning for consistency
              'disablekb': roomData.isRoomCreator ? 0 : 1 // Disable keyboard controls for guests
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange,
              'onError': (e) => {
                console.error('YouTube player error:', e);
                // Add system message for the error
                setChatMessages(prev => [...prev, {
                  id: Date.now(),
                  user: 'System',
                  text: `Video error: ${getYoutubeErrorMessage(e.data)}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'system'
                }]);
              }
            }
          });
        } catch (error) {
          console.error('Error initializing YouTube player:', error);
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            user: 'System',
            text: 'Failed to initialize YouTube player. Please refresh the page.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'system'
          }]);
          return;
        }
        
        playerRef.current = player;
        
        // Add extra debug output
        console.log('YouTube player initialized:', player);
      }
    }, 200);
  };  // Enhanced YouTube API event handlers for better control and synchronization
  const onPlayerReady = (event) => {
    console.log('Player ready', event.target);
    
    // Store the player for later use
    playerRef.current = event.target;
    
    // Setup an interval for checking time progress for creator only
    // This helps detect when users manually drag the progress bar
    if (roomData.isRoomCreator) {
      // Track the last reported position to detect seeks
      let lastReportedTime = event.target.getCurrentTime();
      let lastPlayerState = event.target.getPlayerState();
      
      // Check every 3 seconds for significant position changes that weren't from normal playback
      const seekDetectionInterval = setInterval(() => {
        if (!playerRef.current) {
          clearInterval(seekDetectionInterval);
          return;
        }
        
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const currentState = playerRef.current.getPlayerState();
          
          // If we're playing, check if position jumped more than expected
          if (lastPlayerState === window.YT.PlayerState.PLAYING && 
              currentState === window.YT.PlayerState.PLAYING) {
            
            // Calculate expected time range (with 4s tolerance for network/processing delays)
            const expectedMaxTime = lastReportedTime + 3.5; // 3s interval + 0.5s tolerance
            
            // If time jumped forward too much or backward at all while playing
            if (currentTime > expectedMaxTime || currentTime < lastReportedTime - 0.5) {
              console.log(`Detected manual seek from ${lastReportedTime} to ${currentTime}`);
              // Treat as manual seek and sync others
              handleSeek.current(currentTime);
            }
          }
          
          // Update tracked values
          lastReportedTime = currentTime;
          lastPlayerState = currentState;
          
        } catch (e) {
          console.error("Error in seek detection:", e);
        }
      }, 3000);
    }
    
    // Enhanced initialization for better sync
    if (roomData.inRoom && roomData.roomId && videoIdRef.current) {
      // If this client is not the room creator, disable all controls
      if (!roomData.isRoomCreator) {
        // Apply multiple layers of control restrictions
        const iframe = event.target.getIframe();
        
        // Make the iframe non-interactive but allow visibility
        iframe.style.pointerEvents = 'none';
        
        // Add a transparent overlay to prevent any interaction with the player
        const playerContainer = iframe.parentElement;
        if (playerContainer) {
          // Check if overlay already exists
          let overlay = playerContainer.querySelector('.player-control-overlay');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'player-control-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '10';
            overlay.style.cursor = 'not-allowed';
            
            // Add message to indicate video is controlled by creator
            const message = document.createElement('div');
            message.innerText = 'Video is controlled by the room creator';
            message.style.position = 'absolute';
            message.style.bottom = '10px';
            message.style.left = '50%';
            message.style.transform = 'translateX(-50%)';
            message.style.backgroundColor = 'rgba(0,0,0,0.7)';
            message.style.color = 'white';
            message.style.padding = '8px 12px';
            message.style.borderRadius = '4px';
            message.style.fontSize = '14px';
            
            overlay.appendChild(message);
            playerContainer.style.position = 'relative';
            playerContainer.appendChild(overlay);
          }
        }
        
        console.log('Video controls are disabled - the room creator controls playback');
        
        // Force player to be paused initially to prevent auto-start mismatch
        event.target.pauseVideo();
        
        // Wait to make sure pause takes effect
        setTimeout(() => {
          // Then join the video room for sync
          joinVideoRoom();
        }, 500);
      } else {
        // For creators, ensure controls are fully enabled
        event.target.getIframe().style.pointerEvents = 'auto';
        console.log('As room creator, you control the video for all participants');
        
        // Explicitly ensure the video is paused to start
        event.target.pauseVideo();
        
        // Join the video room after ensuring the video is paused
        setTimeout(() => {
          joinVideoRoom();
        }, 300);
      }
    }
    
    // Try to get video title
    try {
      const videoData = event.target.getVideoData();
      if (videoData && videoData.title) {
        setVideoTitle(videoData.title);
      }
    } catch (err) {
      console.error('Could not get video title', err);
    }
  };
    // Create debounced emitters for video control events to prevent broadcast storms
  const debouncedVideoControl = useRef(
    debounce((action, time) => {
      if (!roomData.roomId || !socket.connected || !videoIdRef.current) return;
      
      console.log(`Sending debounced ${action} event to room at time:`, time);
      
      // Emit single event to the new unified handler
      socket.emit('video-control', {
        roomId: roomData.roomId,
        action,
        time,
        videoId: videoIdRef.current,
        userId: roomData.inviterId || socket.id
      });
    }, 200, { leading: true, trailing: true, maxWait: 1000 })
  ).current;
  
  // Enhanced player state change handler with debouncing
  const onPlayerStateChange = (event) => {
    // Only allow the room creator to control the video
    if (!roomData.isRoomCreator || isRemoteUpdateRef.current || !socket.connected) return;
    
    const player = playerRef.current;
    if (!player) return;
    
    try {
      // Handle state changes with debouncing to prevent network congestion
      switch (event.data) {
        case window.YT.PlayerState.PLAYING:
          console.log('Video is playing, broadcasting to room (debounced)');
          
          // Get current time and validate
          const playTime = player.getCurrentTime();
          if (isNaN(playTime)) {
            console.error('Invalid play time received from player:', playTime);
            return;
          }
          
          // Use the debounced emitter to prevent excessive events
          debouncedVideoControl('play', playTime);
          
          break;
          
        case window.YT.PlayerState.PAUSED:
          console.log('Video is paused, broadcasting to room (debounced)');
          
          // Get current time and validate
          const pauseTime = player.getCurrentTime();
          if (isNaN(pauseTime)) {
            console.error('Invalid pause time received from player:', pauseTime);
            return;
          }
          
          // Use the debounced emitter to prevent excessive events
          debouncedVideoControl('pause', pauseTime);
          
          break;
      }
    } catch (error) {
      console.error('Error in player state change:', error);
    }
  };
  
  // Manual seek handler with debouncing
  const handleSeek = useRef(
    debounce((newTime) => {
      if (!roomData.isRoomCreator || !socket.connected) return;
      
      console.log(`Manual seek detected, sending seek event to: ${newTime}`);
      
      socket.emit('video-control', {
        roomId: roomData.roomId,
        action: 'seek',
        time: newTime,
        videoId: videoIdRef.current,
        userId: roomData.inviterId || socket.id
      });
    }, 250)
  ).current;
  
  const handleSubmitUrl = (e) => {
    e.preventDefault();
    if (!videoUrl) {
      addNotification("Please enter a YouTube video URL", "warning");
      return;
    }
      
    // If in a room and not the creator, disallow changing videos
    if (roomData.inRoom && !roomData.isRoomCreator) {
      console.log('Only the room creator can change videos');
      addNotification('Only the room creator can change videos', "warning");
      return;
    }
    
    // Extract the video ID from the URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      addNotification('Invalid YouTube URL', "error");
      return;
    }
    
    videoIdRef.current = videoId;
    
    // Force reload the iframe with autoplay
    const videoElement = document.querySelector('.video-iframe');
    if (videoElement) {
      const embedUrl = getYouTubeEmbedUrl(videoUrl);
      videoElement.src = embedUrl + '&autoplay=1&enablejsapi=1';
      
      // If we're in a room, try to join the video room after loading
      if (roomData.inRoom && roomData.roomId) {
        joinVideoRoom();
        
        // If creator is changing video, notify others
        if (roomData.isRoomCreator) {
          // Emit video change event to notify other users
          socket.emit('video-change', {
            roomId: roomData.roomId,
            videoId: videoId,
            videoUrl: videoUrl
          });
        }
      }
    }
  };  // Enhanced join video room function for better synchronization
  const joinVideoRoom = async () => {
    if (!roomData.inRoom || !roomData.roomId || !videoIdRef.current) {
      console.log('Missing required data for video room join:', 
                  { inRoom: roomData.inRoom, roomId: roomData.roomId, videoId: videoIdRef.current });
      return;
    }
    
    // Track if we've already joined this specific video room
    const rejoining = hasJoinedVideoRoom.current === videoIdRef.current;
    if (rejoining) {
      console.log('Already joined this video room, but rejoining to ensure connection');
    }
    
    try {
      // Connect socket if not already connected
      if (!socket.connected) {
        console.log('Socket not connected, connecting now...');
        socket.connect();
        // Wait for connection to establish with timeout
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, 5000)), // Timeout after 5 seconds
          new Promise(resolve => {
            const connectHandler = () => {
              socket.off('connect', connectHandler);
              resolve();
            };
            socket.on('connect', connectHandler);
          })
        ]);
        
        if (!socket.connected) {
          console.error('Socket connection timed out');
          throw new Error('Socket connection timed out');
        }
      }
      
      console.log(`Joining video room: ${roomData.roomId} for video: ${videoIdRef.current} with socket ID: ${socket.id}`);
      
      // Create a promise to wait for server response with timeout
      const joinPromise = new Promise((resolve, reject) => {
        // Set up one-time event listeners
        const onSuccess = (data) => {
          socket.off('join-video-room-success', onSuccess);
          socket.off('join_video_room_success', onSuccess); // Also handle underscore version
          socket.off('join-video-room-error', onError);
          socket.off('join_video_room_error', onError); // Also handle underscore version
          resolve(data);
        };
        
        const onError = (error) => {
          socket.off('join-video-room-success', onSuccess);
          socket.off('join-video-room-error', onError);
          reject(error);
        };
        
        // Set timeout to avoid hanging
        const timeout = setTimeout(() => {
          socket.off('join-video-room-success', onSuccess);
          socket.off('join-video-room-error', onError);
          reject(new Error('Join video room request timed out'));
        }, 5000);
        
        // Set up listeners
        socket.once('join-video-room-success', (data) => {
          clearTimeout(timeout);
          
          // If we're not the room creator and we've received initial state data
          if (!roomData.isRoomCreator && data && data.videoState) {
            console.log('Received initial video state on join:', data.videoState);
            
            // Apply the initial state immediately
            setTimeout(() => {
              if (playerRef.current) {
                // Force a sync with the initial state
                applySyncCommand({
                  action: data.videoState.isPlaying ? 'play' : 'pause',
                  time: data.videoState.currentTime || 0,
                  videoId: data.videoState.videoId,
                  serverTime: Date.now()
                }, 0);
              }
            }, 500); // Short delay to ensure player is ready
          }
          
          onSuccess(data);
        });
        
        socket.once('join-video-room-error', (error) => {
          clearTimeout(timeout);
          onError(error);
        });
        
        // Check creator history as fallback
        const creatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
        const isCreatorFromHistory = creatorHistory[roomData.roomId] === true;
        const effectiveCreatorStatus = roomData.isRoomCreator || isCreatorFromHistory;
        
        // Send join request with all information - use combined creator status
        socket.emit('join-video-room', {
          roomId: roomData.roomId,
          videoId: videoIdRef.current,
          userId: roomData.inviterId || localStorage.getItem('userId'),
          username: userName,
          socketId: socket.id, // Include socket ID to help server tracking
          isCreator: effectiveCreatorStatus,
          requestInitialState: !effectiveCreatorStatus // Request initial state if not creator
        });
        
        // Also use an underscore version for compatibility
        socket.emit('join_video_room', {
          roomId: roomData.roomId,
          videoId: videoIdRef.current,
          userId: roomData.inviterId || localStorage.getItem('userId'),
          username: userName,
          socketId: socket.id,
          isCreator: effectiveCreatorStatus,
          requestInitialState: !effectiveCreatorStatus // Request initial state if not creator
        });
      });
      
      // Wait for join response
      await joinPromise;
      hasJoinedVideoRoom.current = videoIdRef.current;
      
      // Log that user joined video sync room instead of adding a chat message
      console.log('Joined video sync room. The video is now synchronized with other users.');
        // If creator, send initial state to others
      if (roomData.isRoomCreator && playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const playerState = playerRef.current.getPlayerState();
          const isPlaying = playerState === window.YT.PlayerState.PLAYING;
          
          console.log('Sending initial video state as creator:', { currentTime, isPlaying });
          
          // Emit initial state to all participants using multiple event names for compatibility
          socket.emit('video-state-update', {
            roomId: roomData.roomId,
            videoId: videoIdRef.current,
            currentTime: currentTime,
            isPlaying: isPlaying,
            serverTime: Date.now()
          });
          
          socket.emit('video_state_update', {
            roomId: roomData.roomId,
            videoId: videoIdRef.current,
            currentTime: currentTime,
            isPlaying: isPlaying,
            serverTime: Date.now()
          });
          
          // Also send as a sync event
          socket.emit('sync-video', {
            roomId: roomData.roomId,
            videoId: videoIdRef.current,
            action: isPlaying ? 'play' : 'pause',
            time: currentTime,
            serverTime: Date.now()
          });
          
          // Direct video-control event
          socket.emit('video-control', {
            roomId: roomData.roomId,
            action: isPlaying ? 'play' : 'pause',
            time: currentTime,
            videoId: videoIdRef.current,
            userId: roomData.inviterId || socket.id
          });
          
          console.log('Initial state sent through multiple channels');
        } catch (error) {
          console.error('Error sending initial video state:', error);
        }
      }
    } catch (error) {
      console.error('Error joining video room:', error);
      
      // Try again with a delay if it failed
      setTimeout(() => {
        console.log('Retrying video room join...');
        hasJoinedVideoRoom.current = null; // Reset to force rejoin
        joinVideoRoom();
      }, 2000);
    }
  };
  // Reference for scrolling to bottom
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket.connected || !roomData.inRoom) return;
    
    // Generate a unique ID for this message
    const messageId = `${socket.id}-${Date.now()}`;
      // Create message data with enhanced type information
    const messageData = {
      roomId: roomData.roomId,
      message: newMessage,
      username: userName,
      messageId,
      timestamp: new Date(), // Ensure we have timestamp
      socketId: socket.id,   // Include socket ID for better tracking
      type: 'lecture-chat'   // Mark as lecture chat specifically
    };
      
    console.log('Sending lecture message to room:', messageData);
      
    // Send message via socket with lecture-specific event name - we'll rely on the server broadcast
    // for displaying the message to avoid duplicates
    socket.emit('lecture-send-message', messageData);
    
    // Also emit with underscore format for compatibility
    socket.emit('lecture_send_message', messageData);
    
    // Additionally send with the type-aware handler
    socket.emit('send-message-with-type', messageData);
    
    // NOTE: We no longer add the message directly to the chat - we'll get it back from the server
    // This prevents duplicate messages for the sender
    
    setNewMessage('');
  };
  // Notes related functions
  const saveNote = async () => {
    if (!notes.trim()) {
      addNotification('Please add some notes before saving.', "info");
      return;
    }
    
    // Create the note object - removed timestamp functionality
    const noteData = {
      content: notes,
      videoId: videoIdRef.current,
      videoTitle: videoTitle,
      videoUrl: videoUrl
      // Removed videoTimestamp field
    };
    
    try {
      const response = await createNote(noteData);
      
      if (response.success) {
        // Update the local state with the new note
        setSavedNotes(prevNotes => [response.data, ...prevNotes]);
        
        addNotification('Note saved successfully!', "success");
        
        setNotes('');
      } else {
        addNotification(response.message || 'Failed to save note', "error");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      addNotification('Failed to save note. Please try again.', "error");
    }
  };
  
  // Format video time as mm:ss - keep this utility function as it might be used elsewhere
  const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteNote = (noteId) => {
    // Set the note ID and show the confirmation dialog
    setNoteToDelete(noteId);
    setShowDeleteConfirmation(true);
  };
  
  const handleConfirmDelete = async () => {
    // Only proceed if we have a valid note ID
    if (noteToDelete) {
      try {
        const response = await deleteNoteAPI(noteToDelete);
        
        if (response.success) {
          // Update local state
          setSavedNotes(prevNotes => prevNotes.filter(note => note._id !== noteToDelete));
          addNotification("Note deleted successfully!", "success");
        } else {
          addNotification(response.message || 'Failed to delete note', "error");
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        addNotification('An error occurred while deleting note', "error");
      }
      
      // Reset state
      setNoteToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };
  
  const handleCancelDelete = () => {
    // Reset state without deleting
    setNoteToDelete(null);
    setShowDeleteConfirmation(false);
  };
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  const handlePasteNotes = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setNotes(text);
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };
  
  // Function to sort notes based on criteria
  const sortNotes = (notes) => {
    if (!Array.isArray(notes)) return [];
    
    switch (sortCriteria) {
      case 'newest':
        return [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return [...notes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'videoTitle':
        return [...notes].sort((a, b) => {
          const titleA = a.videoTitle?.toLowerCase() || '';
          const titleB = b.videoTitle?.toLowerCase() || '';
          return titleA.localeCompare(titleB);
        });
      default:
        return notes;
    }
  };

  // Get current notes for pagination
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const sortedNotes = sortNotes(savedNotes);
  const currentNotes = sortedNotes.slice(indexOfFirstNote, indexOfLastNote);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Reset to first page when sort criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortCriteria]);
  // Handle video sync messages from server with enhanced debouncing
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return undefined;
    }
    
    console.log('Setting up video sync event listeners with improved handling');
    
    // Create debounced handler that will prevent too many sync events in a short time
    // This helps prevent video glitches when multiple sync events arrive close together
    const debouncedSyncHandler = debounce((data) => {
      console.log('Handling debounced video sync:', data);
      
      // Process the sync command
      applySyncCommand(data);
    }, 150, { leading: true, trailing: true, maxWait: 300 }); // Process first and last event in a burst
    
    // Callback for video sync events
    const handleVideoSync = (data) => {
      console.log('Received video sync:', data);
      
      // Don't process if this is our own message and we're the creator
      if (roomData.isRoomCreator && !data.isRequestedUpdate) {
        console.log('Ignoring sync as room creator - this prevents control loops');
        return;
      }
      
      // If player is not initialized yet, retry with increasing delay
      if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') {
        console.log('Player not ready for sync, will retry with progressive delay');
        
        // Use exponential backoff for retries
        const attemptSync = (attempt = 1, maxAttempts = 5) => {
          if (attempt > maxAttempts) {
            console.log(`Giving up after ${maxAttempts} attempts - player still not ready`);
            return;
          }
          
          const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000); // Exponential up to 5 seconds
          console.log(`Attempt ${attempt}: Retrying sync in ${delay}ms`);
          
          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
              console.log(`Player ready on attempt ${attempt}, applying sync command`);
              applySyncCommand(data);
            } else {
              // Try again with increasing delay
              attemptSync(attempt + 1, maxAttempts);
            }
          }, delay);
        };
        
        attemptSync(1);
        return;
      }
      
      // Use debounced handler for most events, but process seek events immediately
      if (data.action === 'seek') {
        // Seeks need immediate processing to maintain synchronization
        applySyncCommand(data);
      } else {
        // Play/pause can be debounced to prevent flickering
        debouncedSyncHandler(data);
      }
    };
      
    // Function to apply sync commands to the player
    const applySyncCommand = (data, retryCount = 0) => {
      // Check if we're syncing the same video
      if (data.videoId !== videoIdRef.current) {
        console.log(`Video ID mismatch: got ${data.videoId}, have ${videoIdRef.current}`);
        return;
      }
      
      const player = playerRef.current;
      if (!player) {
        // Retry up to 3 times if player is not ready
        if (retryCount < 3) {
          console.log(`Player not ready, retrying in ${500 * (retryCount + 1)}ms (attempt ${retryCount + 1})`);
          setTimeout(() => applySyncCommand(data, retryCount + 1), 500 * (retryCount + 1));
        }
        return;
      }
      
      try {
        // Calculate any time drift (compensate for network delay)
        let adjustedTime = data.time;
        if (data.action === 'play' && data.serverTime) {
          const clientServerDiff = Date.now() - data.serverTime;
          if (clientServerDiff > 500) { // Only adjust if delay is significant
            adjustedTime += clientServerDiff / 1000;
            console.log(`Adjusting time by ${clientServerDiff/1000}s for network delay`);
          }
        }
        
        // Set flag to prevent recursive events
        isRemoteUpdateRef.current = true;      // Apply the sync action with improved handling of time position and network compensation
        switch (data.action) {
          case 'play':
            console.log(`Syncing: play at ${adjustedTime}`);
            
            // Force accurate seek first with initial state check
            const initialState = player.getPlayerState();
            const initialPos = player.getCurrentTime();
            console.log(`Initial state before play: state=${initialState}, position=${initialPos}, target=${adjustedTime}`);
            
            // First pause to ensure consistent seek behavior
            player.pauseVideo();
            
            // Calculate additional adjustment for very recent syncs to compensate for processing time
            let playTimeAdjustment = 0;
            if (data.serverTime) {
              // How much time has passed since server sent this command
              const networkDelay = (Date.now() - data.serverTime) / 1000;
              
              // If significant delay, adjust the target position
              if (networkDelay > 0.3) {
                playTimeAdjustment = networkDelay;
                console.log(`Compensating for ${playTimeAdjustment.toFixed(2)}s network delay`);
                adjustedTime += playTimeAdjustment;
              }
            }
            
            // Wait a brief moment to ensure pause takes effect
            setTimeout(() => {
              // Now seek to the correct position with network delay compensation
              player.seekTo(adjustedTime, true);
              
              // Enhanced verification with more attempts and adaptive timing
              let seekCheckAttempts = 0;
              const maxSeekAttempts = 7; // Increased for better reliability
              
              const verifySeekAndPlay = () => {
                const currentPos = player.getCurrentTime();
                
                // Special handling for position 0 problem
                if (currentPos < 0.5 && adjustedTime > 1.0) {
                  // This is clearly wrong - video reset to beginning when it shouldn't have
                  console.log(`CRITICAL ERROR: Video reset to position ${currentPos} instead of ${adjustedTime}, fixing immediately...`);
                  player.seekTo(adjustedTime, true);
                  setTimeout(verifySeekAndPlay, 300);
                  return;
                }
                
                // Check if we're at the expected position with tighter tolerance
                if (Math.abs(currentPos - adjustedTime) > 1.0) {
                  if (seekCheckAttempts < maxSeekAttempts) {
                    seekCheckAttempts++;
                    const retryDelay = 150 + (seekCheckAttempts * 75); // Progressive delay with longer times
                    console.log(`Seek verification failed on attempt ${seekCheckAttempts}. Expected: ${adjustedTime}, Got: ${currentPos}. Retrying in ${retryDelay}ms...`);
                    
                    // Try again with a fresh seek
                    player.seekTo(adjustedTime, true);
                    setTimeout(verifySeekAndPlay, retryDelay);
                  } else {
                    console.log(`After ${maxSeekAttempts} attempts, best position: ${currentPos}, expected: ${adjustedTime}. Playing anyway.`);
                    // Store actual time in case player jumps back to 0
                    const finalPos = player.getCurrentTime();
                    
                    // Start playback
                    player.playVideo();
                    
                    // Extra verification to prevent starting at position 0
                    setTimeout(() => {
                      if (player.getCurrentTime() < 1.0 && finalPos > 1.0) {
                        console.log("Video incorrectly reset to beginning, fixing position");
                        player.seekTo(finalPos, true);
                        setTimeout(() => player.playVideo(), 150);
                      }
                      
                      // Double verification pass to ensure it's really at the right position and playing
                      setTimeout(() => {
                        const finalCheckPos = player.getCurrentTime();
                        const finalState = player.getPlayerState();
                        if (finalState !== window.YT.PlayerState.PLAYING) {
                          console.log("Video should be playing but isn't, forcing playback");
                          player.playVideo();
                        }
                        if (finalCheckPos < 1.0 && adjustedTime > 1.0) {
                          console.log("Position still reset to beginning after multiple attempts, trying one last time");
                          player.seekTo(adjustedTime, true);
                          setTimeout(() => player.playVideo(), 150);
                        }
                      }, 1000);
                    }, 300);
                  }
                } else {
                  console.log(`Seek successful after ${seekCheckAttempts + 1} attempts. Now at ${currentPos}, expected ${adjustedTime}`);
                  
                  // Start playback
                  player.playVideo();
                  
                  // Multiple verification passes to ensure it's really playing at the right position
                  const verifyPlaying = (attemptsLeft = 3) => { // Increased verification passes
                    if (attemptsLeft <= 0) return;
                    
                    setTimeout(() => {
                      const playState = player.getPlayerState();
                      const playPos = player.getCurrentTime();
                      
                      if (playState !== window.YT.PlayerState.PLAYING) {
                        console.log(`Play verification failed (state=${playState}). Playing again.`);
                        player.playVideo();
                      } else if (playPos < 1.0 && adjustedTime > 1.0) {
                        // Double-check position didn't reset to 0
                        console.log("Position unexpectedly reset to beginning, fixing position");
                        player.seekTo(adjustedTime, true);
                        setTimeout(() => player.playVideo(), 150);
                      } else if (Math.abs(playPos - adjustedTime) > 3.0) {
                        // If we've drifted significantly from the target position
                        console.log(`Position drifted too much: ${playPos} vs expected ${adjustedTime}, correcting`);
                        player.seekTo(adjustedTime, true);
                        setTimeout(() => player.playVideo(), 150);
                      }
                      
                      // Try again with remaining attempts
                      verifyPlaying(attemptsLeft - 1);
                    }, 500);
                  };
                  
                  verifyPlaying();
                }
              };
              
              // Start verification process
              setTimeout(verifySeekAndPlay, 250);
            }, 150); // Increased delay after pausing
            
            break;          case 'pause':
            console.log(`Syncing: pause at ${data.time}`);
            
            // Get initial state for verification
            const pauseInitialPos = player.getCurrentTime();
            console.log(`Initial position before pause: ${pauseInitialPos}, target: ${data.time}`);
            
            // First seek to ensure we're at the right position when pausing
            player.seekTo(data.time, true);
            
            // Wait for seek to complete with verification
            setTimeout(() => {
              // First pause the video
              player.pauseVideo();
              
              // Check if the seek worked correctly
              setTimeout(() => {
                const afterPausePos = player.getCurrentTime();
                
                // If position is incorrect (especially if it's near 0), try again
                if (Math.abs(afterPausePos - data.time) > 1.5 || 
                    (afterPausePos < 0.5 && data.time > 1.0)) {
                  
                  console.log(`Pause position incorrect: ${afterPausePos}, expected: ${data.time}. Fixing...`);
                  player.seekTo(data.time, true);
                  
                  // Verify final position after second seek
                  setTimeout(() => {
                    const finalPos = player.getCurrentTime();
                    console.log(`Final paused position: ${finalPos}, target was: ${data.time}`);
                    
                    // Ensure player stays paused
                    if (player.getPlayerState() !== window.YT.PlayerState.PAUSED) {
                      console.log("Player should be paused but isn't, pausing again");
                      player.pauseVideo();
                    }
                  }, 300);
                } else {
                  console.log(`Successfully paused at position ${afterPausePos}, target was: ${data.time}`);
                }
              }, 200);
            }, 150);
            break;case 'seek':
            console.log(`Syncing: seek to ${data.time}`);
            
            // First pause the video to ensure consistent seeking behavior
            player.pauseVideo();
            
            // Wait a brief moment to ensure pause takes effect
            setTimeout(() => {
              // Store initial state for better debugging
              const initialState = player.getPlayerState();
              const initialPos = player.getCurrentTime();
              console.log(`Initial state before seek: state=${initialState}, position=${initialPos}, target=${data.time}`);
              
              // More reliable seeking with enhanced verification
              player.seekTo(data.time, true);
              
              // Enhanced verification process with multiple attempts
              let seekVerifyAttempts = 0;
              const maxSeekAttempts = 7; // Increased for reliability
              
              const verifySeek = () => {
                const currentPos = player.getCurrentTime();
                
                // Special handling for position 0 problem
                if (currentPos < 0.5 && data.time > 1.0) {
                  // This is clearly wrong - video reset to beginning when it shouldn't have
                  console.log(`CRITICAL ERROR: Video reset to position ${currentPos} instead of ${data.time}, fixing immediately...`);
                  player.seekTo(data.time, true);
                  // Use a longer delay for this critical fix
                  setTimeout(verifySeek, 300);
                  return;
                }
                
                // Use tighter tolerance for position checking
                if (Math.abs(currentPos - data.time) > 1.0) {
                  if (seekVerifyAttempts < maxSeekAttempts) {
                    seekVerifyAttempts++;
                    // Calculate progressive delay for retries with longer delays for early attempts
                    const retryDelay = 150 + (seekVerifyAttempts * 75);
                    console.log(`Seek verification failed on attempt ${seekVerifyAttempts}. Expected: ${data.time}, Got: ${currentPos}. Trying again in ${retryDelay}ms...`);
                    player.seekTo(data.time, true);
                    setTimeout(verifySeek, retryDelay);
                  } else {
                    console.log(`Still couldn't get exact seek position after ${maxSeekAttempts} attempts. Best position: ${currentPos}, expected: ${data.time}`);
                    // Force one final seek with a larger timeout
                    setTimeout(() => {
                      player.seekTo(data.time, true);
                      
                      // Check final position after final seek
                      setTimeout(() => {
                        const finalPos = player.getCurrentTime();
                        console.log(`Final position after all attempts: ${finalPos}`);
                        
                        // After final seek, restore original playback state
                        restorePlayState();
                      }, 300);
                    }, 500);
                  }
                } else {
                  console.log(`Seek successful on attempt ${seekVerifyAttempts + 1}, now at ${currentPos}, expected ${data.time}`);
                  // After successful seek, restore original playback state
                  restorePlayState();
                }
              };
              
              // Function to restore the original playback state
              const restorePlayState = () => {
                // Get the current player state to determine if we should be playing or not
                const playerState = initialState === window.YT.PlayerState.PLAYING ? 
                                   window.YT.PlayerState.PLAYING : 
                                   player.getPlayerState();
                
                // If we were playing before or should be playing now, resume playback
                if (playerState === window.YT.PlayerState.PLAYING || data.shouldPlay === true) {
                  console.log("Restoring playback after seek");
                  
                  // First verify position one last time
                  const finalCheckPos = player.getCurrentTime();
                  if (Math.abs(finalCheckPos - data.time) > 2.0) {
                    console.log(`Warning: Position still off after seeking. Got: ${finalCheckPos}, expected: ${data.time}`);
                    player.seekTo(data.time, true);
                    setTimeout(() => player.playVideo(), 100);
                  } else {
                    player.playVideo();
                    
                    // Verify playing state actually took effect
                    setTimeout(() => {
                      if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                        console.log("Play command failed, trying again");
                        player.playVideo();
                      }
                    }, 300);
                  }
                } else {
                  console.log("Keeping video paused after seek");
                }
              };
              
              // Start verification process with an initial delay to allow the seek to begin
              setTimeout(verifySeek, 250);
            }, 150);
            break;
        }
      } catch (error) {
        console.error('Error applying sync command:', error);
        
        // Retry on error
        if (retryCount < 3) {
          console.log(`Error syncing, retrying in ${500 * (retryCount + 1)}ms (attempt ${retryCount + 1})`);
          setTimeout(() => applySyncCommand(data, retryCount + 1), 500 * (retryCount + 1));
        }
      }
        
      // Reset flag after a delay that's proportional to the video length but reasonable
      const resetDelay = Math.min(1000 + (adjustedTime * 5), 3000);
      console.log(`Will reset remote update flag in ${resetDelay}ms`);
      
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
        console.log('Remote update flag reset, allowing local control events');
      }, resetDelay);
    };    // Callback for initial video state
    const handleVideoStateUpdate = (data) => {
      console.log('Received video state update:', data);
      
      // Special handling for creator when returning from tab change
      if (roomData.isRoomCreator && data.isRequestedUpdate && data.isCreatorRequest) {
        console.log('Creator received state update after tab visibility change');
        // Don't ignore this update, as it may be in response to our visibility change
      }
      // Normal creator behavior - ignore state updates (since creator controls video)
      else if (roomData.isRoomCreator) {
        console.log('Ignoring video state update as room creator');
        return;
      }
      
      // Check if player and video ID match
      const player = playerRef.current;
      if (!player) {
        console.log('Player not ready, will retry in 1 second');
        setTimeout(() => handleVideoStateUpdate(data), 1000);
        return;
      }
      
      if (data.videoId !== videoIdRef.current) {
        console.log('Video ID mismatch, expected:', videoIdRef.current, 'got:', data.videoId);
        return;
      }
      
      try {
        // Set flag to prevent recursive events
        isRemoteUpdateRef.current = true;
        
        // Calculate any time drift if we have server time
        let adjustedTime = data.currentTime;
        if (data.serverTime) {
          const clientServerDiff = Date.now() - data.serverTime;
          if (clientServerDiff > 500) {
            adjustedTime += clientServerDiff / 1000;
            console.log(`Adjusting time by ${clientServerDiff/1000}s for network delay`);
          }
        }
        
        console.log(`Applying video state: time=${adjustedTime}, playing=${data.isPlaying}`);
        
        // Force a good seek first
        player.seekTo(adjustedTime, true);
        
        // Use longer timeout for reliability
        setTimeout(() => {
          if (data.isPlaying) {
            console.log('Starting video playback from state update');
            player.playVideo();
            
            // Double-check playing state after a short delay
            setTimeout(() => {
              if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                console.log('Forcing play again - video did not start');
                player.playVideo();
              }
            }, 1000);
          } else {
            console.log('Pausing video from state update');
            player.pauseVideo();
          }
          
          // Reset flag after a delay
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
            console.log('Video state update flag reset');
          }, 2000);
        }, 300);
      } catch (error) {
        console.error('Error applying video state update:', error);
        isRemoteUpdateRef.current = false;
      }
    };
    
    // Video control event - more reliable for initial sync
    const handleVideoControl = (data) => {
      console.log('Received video control:', data);
      
      // Convert to sync format and process
      handleVideoSync({
        videoId: data.videoId,
        action: data.action,
        time: data.time,
        serverTime: Date.now()
      });
    };
      
    // Set up listeners directly on the socket
    socket.on('sync-video', handleVideoSync);
    socket.on('video-control', handleVideoControl);
    socket.on('video-state-update', handleVideoStateUpdate);
    
    // Also listen to underscore versions for compatibility
    socket.on('sync_video', handleVideoSync);
    socket.on('video_control', handleVideoControl);
    socket.on('video_state_update', handleVideoStateUpdate);
    
    return () => {
      // Clean up all listeners
      socket.off('sync-video', handleVideoSync);
      socket.off('video-control', handleVideoControl);
      socket.off('video-state-update', handleVideoStateUpdate);
      socket.off('sync_video', handleVideoSync);
      socket.off('video_control', handleVideoControl);
      socket.off('video_state_update', handleVideoStateUpdate);
    };
  }, [socket.connected, roomData.inRoom, roomData.roomId, roomData.isRoomCreator]);
  // Handle creator-specific video seeked event for seeking sync (not captured by state change)
  useEffect(() => {
    if (!roomData.isRoomCreator || !playerRef.current) {
      return undefined;
    }
      // Function to handle seeking
    const handleSeek = () => {
      if (isRemoteUpdateRef.current || !playerRef.current) return;
      
      const currentTime = playerRef.current.getCurrentTime();
      console.log(`Sending seek sync to ${currentTime}`);
      
      // Direct socket emit for more reliability
      socket.emit('video-control', {
        roomId: roomData.roomId,
        action: 'seek',
        time: currentTime,
        videoId: videoIdRef.current,
        userId: roomData.inviterId || socket.id
      });
      
      // Also emit with underscore format and with sync-video for maximum compatibility
      socket.emit('video_control', {
        roomId: roomData.roomId,
        action: 'seek',
        time: currentTime,
        videoId: videoIdRef.current,
        userId: roomData.inviterId || socket.id
      });
      
      socket.emit('sync-video', {
        roomId: roomData.roomId,
        action: 'seek',
        time: currentTime,
        videoId: videoIdRef.current,
        serverTime: Date.now()
      });      
      // Log the position change instead of adding a system message
      console.log(`Video position changed to ${formatVideoTime(currentTime)}`);
    };
    
    // Track seeking with a polling approach since YouTube API doesn't have a reliable seek event
    let seekCheckInterval;
    let lastTime = -1;
    let lastPlayerState = -1;
    
    // Start polling if player exists and user is creator
    if (playerRef.current && roomData.isRoomCreator) {
      seekCheckInterval = setInterval(() => {
        if (!playerRef.current) return;
        
        const currentTime = playerRef.current.getCurrentTime();
        const playerState = playerRef.current.getPlayerState();
        
        // If the video is paused and the time changed significantly, it was a seek
        if (playerState === window.YT.PlayerState.PAUSED && lastPlayerState === window.YT.PlayerState.PAUSED) {
          if (Math.abs(currentTime - lastTime) > 1.5) { // Threshold for seek detection
            handleSeek();
          }
        }
        
        lastTime = currentTime;
        lastPlayerState = playerState;
      }, 1000);
    }
    
    return () => {
      if (seekCheckInterval) {
        clearInterval(seekCheckInterval);
      }
    };
  }, [roomData.isRoomCreator, roomData.roomId, roomData.inviterId]);
  
  // Load saved chat messages
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return undefined;
    }
    
    // Load saved chat messages for this room and video
    const loadSavedMessages = () => {
      const storageKey = `lecture_chat_${roomData.roomId}_${videoIdRef.current || 'default'}`;
      try {
        const savedMessages = localStorage.getItem(storageKey);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          setChatMessages(parsed);
          console.log(`Loaded ${parsed.length} saved messages from storage`);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Error loading saved chat messages:', error);
      }
    };
    
    loadSavedMessages();
    
  }, [socket.connected, roomData.inRoom, roomData.roomId, videoIdRef.current]);

// Listen for messages from other users
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return undefined;
    }
    
    console.log('Setting up chat message listeners with socket ID:', socket.id);
      // Process function to avoid duplicates - use a Map for better tracking
    const processedMessages = new Map();
      // Handle incoming messages
    const handleReceiveMessage = (data) => {
      console.log('Received message:', data);
      
      // Normalize data structure from different message formats
      const messageId = data.messageId || data.id || `${data.username}-${Date.now()}`;
      const username = data.username;
      const message = data.message || data.text;
      const timestamp = data.time || data.timestamp || Date.now();
      const isCode = data.isCode || false;
      
      // Skip if we've already processed this exact message
      if (processedMessages.has(messageId)) {
        console.log('Skipping duplicate message with ID:', messageId);
        return;
      }
      
      // Check if this is our own message coming back to us
      const isOurMessage = username === userName;
      
      // Look for existing message with same content (more reliable than just ID)
      const existingMessageIndex = chatMessages.findIndex(msg => 
        (msg.id === messageId) || // Same ID
        (msg.user === (isOurMessage ? 'You' : username) && msg.text === message && // Same content
         Math.abs(new Date(msg.timestamp) - new Date(timestamp)) < 5000) // Within 5 sec
      );
      
      // If we find it in our history, don't show it twice
      if (existingMessageIndex !== -1) {
        console.log('Skipping message already in chat history');
        return;
      }
      
      console.log('Processing new message from:', username);
      
      // Mark as processed with timestamp
      processedMessages.set(messageId, Date.now());
      
      // Limit the size of the processed messages cache to prevent memory leaks
      if (processedMessages.size > 100) {
        const oldestKey = [...processedMessages.entries()]
          .sort((a, b) => a[1] - b[1])[0][0];
        processedMessages.delete(oldestKey);
      }
        // Format the message
      const newMessage = {
        id: messageId,
        user: isOurMessage ? 'You' : username,
        text: message,
        timestamp: new Date(timestamp),
        isCode: isCode
      };
          // Add to messages and save in one operation
      setChatMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newMessage];
        
        // Use lectureRoomChatPersistence utility to save messages
        saveLectureMessages(roomData.roomId, updatedMessages);
        
        return updatedMessages;
      });
        // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    };
    
    // Set up lecture-specific message event handlers
    socket.on('lecture-receive-message', handleReceiveMessage);
    
    // Also listen for underscore version for compatibility
    socket.on('lecture_receive_message', handleReceiveMessage);
      // Clean up
    return () => {
      socket.off('lecture-receive-message', handleReceiveMessage);
      socket.off('lecture_receive_message', handleReceiveMessage);
    };
  }, [socket.connected, roomData.inRoom, roomData.roomId, userName]);
  
  // Load initial messages from persistence
  useEffect(() => {
    if (!roomData.inRoom || !roomData.roomId) return;
    
    console.log(`Loading saved lecture messages for room: ${roomData.roomId}`);
    
    // Load messages using lectureRoomChatPersistence utility
    const savedMessages = loadLectureMessages(roomData.roomId);
    if (savedMessages && savedMessages.length > 0) {
      console.log(`Loaded ${savedMessages.length} lecture messages from persistence`);
      setChatMessages(savedMessages);
      setTimeout(scrollToBottom, 100);
    } else {
      console.log('No saved lecture messages found');
    }
  }, [roomData.inRoom, roomData.roomId]);

  // Enhanced rendering to show creator status and control permissions
  const renderControlStatusIndicator = () => {
    if (!roomData.inRoom) return null;
    
    return (
      <div className="mt-2 mb-4">
        <div className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
          roomData.isRoomCreator 
            ? 'bg-green-900/30 border border-green-600/30 text-green-200'
            : 'bg-gray-900/30 border border-gray-600/30 text-gray-300'
        }`}>
          {roomData.isRoomCreator ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You are controlling this video for all participants</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Video is controlled by the room creator</span>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      
      {/* Notification container with AnimatePresence for smooth transitions */}
      <div className="fixed top-20 right-4 z-50 w-72 space-y-2 pointer-events-none">
        <AnimatePresence>
          {/* Notifications will be rendered here by the NotificationContext */}
        </AnimatePresence>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold mb-6"><span className="bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Watch Together</span></h1>   
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player Section */}
          <div className="lg:w-2/3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 h-full">
              <div className="px-4 pt-4 pb-4">
                <form onSubmit={handleSubmitUrl} className="flex items-center gap-2 mb-4">
                  <div className="flex flex-grow border border-white/20 rounded-lg overflow-hidden bg-[#2d3748]">
                    <input
                      type="text"
                      placeholder={roomData.isRoomCreator ? "YouTube URL..." : "Only the room creator can change videos"}
                      className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 border-none outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2]"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={roomData.inRoom && !roomData.isRoomCreator}
                    />
                    <button
                      type="button"
                      className={`px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors ${roomData.inRoom && !roomData.isRoomCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (roomData.inRoom && !roomData.isRoomCreator) return;
                        const clipboardText = navigator.clipboard.readText();
                        clipboardText.then(text => setVideoUrl(text));
                      }}
                      disabled={roomData.inRoom && !roomData.isRoomCreator}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                  </div>                  <button
                    type="submit"
                    className={`${!roomData.isRoomCreator && roomData.inRoom ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#94C3D2] hover:bg-[#7EB5C3]'} text-white px-6 py-2.5 rounded-lg transition-colors shadow-md font-medium flex-shrink-0`}
                    disabled={!roomData.isRoomCreator && roomData.inRoom}
                    title={!roomData.isRoomCreator && roomData.inRoom ? "Only the room creator can change videos" : "Load this video"}
                  >
                    Watch
                  </button>
                </form>
                {/* Show control status indicator for clearer user experience */}
                {renderControlStatusIndicator()}
              </div>
                {videoUrl ? (
                <div className="w-full border-t border-white/20">
                  {/* IFrame will be replaced by the YouTube API */}
                  <div id="youtube-player" className="video-iframe rounded-lg">
                    {/* This is where the player will be initialized */}
                  </div>
                    {/* Status message for users */}
                  {roomData.inRoom && (
                    <div className={`mt-2 p-2 text-sm rounded ${roomData.isRoomCreator ? 'bg-green-700/50' : 'bg-yellow-600/50'} text-center`}>
                      {roomData.isRoomCreator 
                        ? 'You are the room creator. Your video controls will be synced to all participants.'
                        : 'Video controls are disabled. Playback is synchronized with the room creator.'}
                    </div>
                  )}
                </div>
              ): (
                <div className="flex items-center justify-center h-[600px] bg-white/5 text-gray-400 border-t border-white/20">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">Enter a YouTube URL to begin watching</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Chat and Notes */}
          <div className="lg:w-1/3 flex flex-col h-full">
            {/* Notes Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 mb-6">
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Notes</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasteNotes}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Paste
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors relative"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Saved
                    {savedNotes.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#94C3D2] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                        {savedNotes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-[#94C3D2] hover:bg-[#7EB5C3] text-white rounded-lg flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save Note
                  </button>
                </div>
              </div>
              <div className="p-0">
                <textarea
                  className="w-full h-full p-4 font-mono text-sm bg-[#2d3748] text-white focus:outline-none block resize-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none"
                  style={{ height: '250px' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes for this video or just general notes..."
                ></textarea>
              </div>
            </div>

            {/* Chat Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 flex flex-col" style={{ height: "500px" }}>
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-[#94c3d2]">Room Chat</h2>
                  <p className="text-sm text-white/70">Chat with your friends while watching</p>
                </div>
                <div className={`flex items-center ${(isConnected && videoUrl) ? 'text-green-500' : 'text-red-400'}`}>
                  <div className={`h-2.5 w-2.5 rounded-full mr-2 ${(isConnected && videoUrl) ? 'bg-green-500' : 'bg-red-400'}`}></div>
                  <span className="text-sm">{(isConnected && videoUrl) ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
                <div className="flex-1 p-4 space-y-3 bg-white/5 overflow-y-auto chat-messages" style={{ height: "calc(100% - 140px)" }}>
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map(message => {
                      // Handle system messages with a different style
                      if (message.user === 'System' || message.type === 'system') {
                        return (
                          <div key={message.id} className="flex justify-center">
                            <div className="bg-indigo-900/30 text-indigo-200 px-3 py-2 text-xs rounded-lg border border-indigo-500/30 max-w-[80%] text-center">
                              {message.text}
                            </div>
                          </div>
                        );
                      }
                        const isCurrentUser = message.user === 'You' || message.user === userName;
                        return (
                        <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] ${isCurrentUser ? 'ml-auto' : ''}`}>
                            <div className={`flex items-center ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
                              {!isCurrentUser && (
                                <span className="font-medium text-sm text-white/90 mr-1">{message.user}</span>
                              )}
                              <span className={`text-xs ${isCurrentUser ? 'text-white/90 mr-2' : 'text-white/90 ml-2'}`}>
                                {typeof message.timestamp === 'object' 
                                  ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isCurrentUser && (
                                <span className="font-medium text-sm text-white/90 ml-1">You</span>
                              )}
                            </div>
                              <div className={`rounded-lg px-4 py-2 ${
                                isCurrentUser 
                                  ? 'bg-[#94C3D2] text-white rounded-tr-none' 
                                  : 'bg-yellow-50 text-black rounded-tl-none'
                              }`}>
                                {message.text}
                              </div>
                            </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/20 bg-white/5">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#2d3748] border border-white/20 rounded-lg overflow-hidden">
                    <input
                      type="text"
                      placeholder="Type message..."
                      className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#94C3D2] text-white px-6 py-2.5 rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-md font-medium"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing saved notes - Updated with sorting and pagination */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-4 flex justify-between items-center border-b border-white/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Saved Notes</h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Sorting options */}
            <div className="px-4 pt-3 pb-2 border-b border-white/20 flex flex-wrap gap-2">
              <span className="text-white/70 mr-2 my-auto">Sort by:</span>
              <button 
                onClick={() => setSortCriteria('newest')}
                className={`px-3 py-1 text-sm rounded-full border ${sortCriteria === 'newest' 
                  ? 'bg-[#94C3D2] text-white border-[#94C3D2]' 
                  : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}
              >
                Newest
              </button>
              <button 
                onClick={() => setSortCriteria('oldest')}
                className={`px-3 py-1 text-sm rounded-full border ${sortCriteria === 'oldest' 
                  ? 'bg-[#94C3D2] text-white border-[#94C3D2]' 
                  : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}
              >
                Oldest
              </button>
              <button 
                onClick={() => setSortCriteria('videoTitle')}
                className={`px-3 py-1 text-sm rounded-full border ${sortCriteria === 'videoTitle' 
                  ? 'bg-[#94C3D2] text-white border-[#94C3D2]' 
                  : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}
              >
                Video Title
              </button>
              <div className="ml-auto text-right text-white/70 text-sm">
                {savedNotes.length} note{savedNotes.length !== 1 ? 's' : ''} total
              </div>
            </div>
            
            <div 
              className="p-4 overflow-y-auto flex-1" 
              style={{ 
                maxHeight: 'calc(60vh - 40px)', 
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              {isLoadingNotes ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#94C3D2]"></div>
                  <span className="ml-2 text-white/80">Loading notes...</span>
                </div>
              ) : savedNotes.length > 0 ? (
                <>
                  <ul className="space-y-4">
                    {currentNotes.map(note => (
                      <li key={note._id} className="bg-white/10 p-4 rounded-lg border border-white/20">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs text-white/70">
                            {formatDate(note.createdAt)}
                          </div>
                          <div>
                            <button
                              onClick={() => deleteNote(note._id)}
                              className="bg-red-900/50 text-red-200 border border-red-600/30 px-3 py-1 rounded font-medium hover:bg-red-900/70 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {note.videoTitle && (
                          <div className="mb-2 pb-2 border-b border-white/10">
                            <p className="text-xs font-medium text-[#94C3D2]">Video: {note.videoTitle}</p>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-white/95 font-medium">{note.content}</p>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Pagination */}
                  {savedNotes.length > notesPerPage && (
                    <div className="flex justify-center mt-6 gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded border ${
                          currentPage === 1
                            ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                            : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.ceil(savedNotes.length / notesPerPage) }).map((_, index) => {
                        // Show current page, first, last, and pages around current page
                        const pageNumber = index + 1;
                        const isCurrentPage = pageNumber === currentPage;
                        
                        // Show all page numbers if there are only a few, otherwise use ellipsis
                        const totalPages = Math.ceil(savedNotes.length / notesPerPage);
                        
                        if (totalPages <= 7 || 
                            pageNumber === 1 || 
                            pageNumber === totalPages || 
                            Math.abs(pageNumber - currentPage) <= 1) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => paginate(pageNumber)}
                              className={`px-3 py-1.5 rounded border ${
                                isCurrentPage
                                  ? 'bg-[#94C3D2] text-white border-[#94C3D2]'
                                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } 
                        
                        // Show ellipsis, but only once between page numbers
                        if (
                          (pageNumber === 2 && currentPage > 3) || 
                          (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={pageNumber} className="px-2 py-1.5 text-white/50">...</span>;
                        }
                        
                        // Hide other page numbers
                        return null;
                      })}
                      
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === Math.ceil(savedNotes.length / notesPerPage)}
                        className={`px-3 py-1.5 rounded border ${
                          currentPage === Math.ceil(savedNotes.length / notesPerPage)
                            ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                            : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-white/60 text-center">You don't have any saved notes yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-md text-white/95 p-6 rounded-xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="border-b border-white/10 pb-3 mb-4">
              <h3 className="text-xl font-semibold text-[#94C3D2]">Delete Note</h3>
            </div>
            <p className="mb-6 text-white/90 leading-relaxed">
              Are you sure you want to delete this note? This cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={handleCancelDelete} 
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white/95 rounded-lg transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureRoom;