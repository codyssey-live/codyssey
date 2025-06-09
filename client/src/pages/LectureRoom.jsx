import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useRoom } from '../context/RoomContext';
import { useNotification } from '../context/NotificationContext';
import socket from '../socket';
import {
  loadLectureMessages,
  saveLectureMessages,
} from '../utils/lectureRoomChatPersistence';
import {
  fetchAllNotes,
  createNote,
  deleteNote as deleteNoteAPI,
} from '../utils/noteApiUtils';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { applySyncCommand, emitVideoSync } from '../utils/lectureRoomVideoSync';
import { debounce } from 'lodash'; // Fixed import to use named import

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
  const isRemoteUpdateRef = useRef(false); // Flag to prevent infinite loops
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
      const creatorHistory = JSON.parse(
        localStorage.getItem('roomCreatorHistory') || '{}'
      );
      const isCreatorFromSession =
        localStorage.getItem(`roomCreator_${roomData.roomId}`) === 'true';

      if (
        (creatorHistory[roomData.roomId] === true || isCreatorFromSession) &&
        !roomData.isRoomCreator
      ) {

        setRoomData((prev) => ({ ...prev, isRoomCreator: true }));
      }

      // If we are the creator, make sure it's saved for future sessions
      if (roomData.isRoomCreator) {
        localStorage.setItem(`roomCreator_${roomData.roomId}`, 'true');

        // Update creator history
        const updatedCreatorHistory = {
          ...creatorHistory,
          [roomData.roomId]: true,
        };
        localStorage.setItem(
          'roomCreatorHistory',
          JSON.stringify(updatedCreatorHistory)
        );
      }
    }

    // Connect the socket if not already connected with improved handling
    if (!socket.connected) {
     
      socket.connect();

      socket.on('connect', () => {
        setIsConnected(true);
        

        // If in a room with video, try joining automatically after connection
        if (roomData.inRoom && roomData.roomId && videoIdRef.current) {
          setTimeout(() => joinVideoRoom(), 1000);
        }
      });

      socket.on('connect_error', (error) => {
        // Remove adding error message to chat
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
        
        setSavedNotes(response.data);
      } else {
        
        addNotification('Failed to load notes', 'error');
      }
    } catch (error) {
      addNotification('Error loading notes', 'error');
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
      if (
        playerRef.current &&
        typeof playerRef.current.getVideoData === 'function'
      ) {
        try {
          const videoData = playerRef.current.getVideoData();
          setVideoTitle(videoData.title);
        } catch (error) {
          
        }
      }

      // If we're in a room and have a video ID, try to automatically join the video room
      if (roomData.inRoom && roomData.roomId && videoId && socket.connected) {
        
        setTimeout(() => joinVideoRoom(), 1000); // Small delay to ensure everything is initialized
      }
    }
  }, [location, roomData.inRoom, roomData.roomId, socket.connected]);

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';

    // Match standard YouTube, youtu.be and YouTube playlist URLs
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
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
        // Initialize the player if we have a video ID
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
    };
  }, [videoUrl]);

  // Helper to convert YouTube error codes to readable messages
  const getYoutubeErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 2:
        return 'Invalid video ID';
      case 5:
        return 'Video cannot be played in the player';
      case 100:
        return 'Video not found or removed';
      case 101:
      case 150:
        return 'Video owner does not allow embedding';
      default:
        return 'Unknown error';
    }
  };

  // Initialize the YouTube player
  const initializePlayer = (videoId) => {
    if (!videoId) return;


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
              'disablekb': roomData.isRoomCreator ? 0 : 1, // Disable keyboard controls for guests
            },
            events: {
              'onReady': onPlayerReady,
              // Make sure to define onPlayerStateChange before using it here
              'onStateChange': onPlayerStateChange,
              'onError': (e) => {

                // Remove adding error message to chat
              },
            },
          });
        } catch (error) {
         
          return;
        }

        playerRef.current = player;

        // Add extra debug output
       
      }
    }, 200);
  };

  // Improved player setup with less intrusive controls overlay
  const onPlayerReady = (event) => {
  

    // Store the player for later use
    playerRef.current = event.target;

    // Setup an interval for checking time progress for creator only
    if (roomData.isRoomCreator) {
      // Track the last reported position to detect seeks
      let lastReportedTime = event.target.getCurrentTime();
      let lastPlayerState = event.target.getPlayerState();

      // More frequent check interval for better responsiveness
      const seekDetectionInterval = setInterval(() => {
        if (!playerRef.current) {
          clearInterval(seekDetectionInterval);
          return;
        }

        try {
          const currentTime = playerRef.current.getCurrentTime();
          const currentState = playerRef.current.getPlayerState();

          // If we're playing, check if position jumped more than expected
          if (
            lastPlayerState === window.YT.PlayerState.PLAYING &&
            currentState === window.YT.PlayerState.PLAYING
          ) {
            // Tighter tolerance for detection
            const expectedMaxTime = lastReportedTime + 2.5; // Reduced tolerance

            // If time jumped forward too much or backward at all while playing
            if (
              currentTime > expectedMaxTime ||
              currentTime < lastReportedTime - 0.5
            ) {
             
              // Treat as manual seek and sync others
              handleSeek.current(currentTime);
            }
          }

          // Update tracked values
          lastReportedTime = currentTime;
          lastPlayerState = currentState;
        } catch (e) {
         
        }
      }, 1500); // Reduced interval for better responsiveness (from 3000ms)
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
          let overlay = playerContainer.querySelector(
            '.player-control-overlay'
          );
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

            // REMOVE the overlay text message that was causing interruption
            // Keep the invisible overlay to block interactions

            playerContainer.style.position = 'relative';
            playerContainer.appendChild(overlay);
          }
        }

       

        // Force player to be paused initially to prevent auto-start mismatch
        event.target.pauseVideo();

        // Reduced delay before joining video room for faster synchronization
        setTimeout(() => {
          // Then join the video room for sync
          joinVideoRoom();
        }, 200); // Reduced from 500ms
      } else {
        // For creators, ensure controls are fully enabled
        event.target.getIframe().style.pointerEvents = 'auto';
       

        // Explicitly ensure the video is paused to start
        event.target.pauseVideo();

        // Join the video room after ensuring the video is paused (with reduced delay)
        setTimeout(() => {
          joinVideoRoom();
        }, 150); // Reduced from 300ms
      }
    }

    // Try to get video title
    try {
      const videoData = event.target.getVideoData();
      if (videoData && videoData.title) {
        setVideoTitle(videoData.title);
      }
    } catch (err) {
     
    }
  };

  // Define the missing onPlayerStateChange function
  const onPlayerStateChange = (event) => {
    // Only allow the room creator to control the video
    if (!roomData.isRoomCreator || !socket.connected) return;

    const player = playerRef.current;
    if (!player) return;

    // Important: Skip sending events if this is triggered by a remote update
    if (isRemoteUpdateRef.current) {
      
    }

    try {
      // Handle state changes with debouncing to prevent network congestion
      switch (event.data) {
        case window.YT.PlayerState.PLAYING:
          

          // Get current time and validate
          const playTime = player.getCurrentTime();
          if (isNaN(playTime)) {
            return;
          }

          // Use the debounced emitter to prevent excessive events
          debouncedVideoControl('play', playTime);
          break;

        case window.YT.PlayerState.PAUSED:
         

          // Get current time and validate
          const pauseTime = player.getCurrentTime();
          if (isNaN(pauseTime)) {
            
            return;
          }

          // Use the debounced emitter to prevent excessive events
          debouncedVideoControl('pause', pauseTime);
          break;
      }
    } catch (error) {
      
    }
  };

  // Create more responsive debounced emitters for video control events
  const debouncedVideoControl = useRef(
    debounce(
      (action, time) => {
        if (!roomData.roomId || !socket.connected || !videoIdRef.current)
          return;

        // Add timestamp for network compensation
        const timestamp = Date.now();

        // Send both immediate and standard sync events for redundancy
        socket.emit('video-control', {
          roomId: roomData.roomId,
          action,
          time,
          videoId: videoIdRef.current,
          userId: roomData.inviterId || socket.id,
          timestamp,
          immediate: true,
        });

        // Additional sync events for reliability
        socket.emit(`creator-${action}-video`, {
          roomId: roomData.roomId,
          videoId: videoIdRef.current,
          time,
          timestamp,
          immediate: true,
        });

        // Send state update for complete synchronization
        socket.emit('video-state-update', {
          roomId: roomData.roomId,
          videoId: videoIdRef.current,
          currentTime: time,
          isPlaying: action === 'play',
          serverTime: timestamp,
          fromCreator: true,
          immediate: true,
        });
      },
      50, // Reduced debounce time for faster response
      { leading: true, trailing: false }
    )
  ).current;

  // More responsive seek handler with verification
  const handleSeek = useRef(
    debounce((newTime) => {
      if (!roomData.isRoomCreator || !socket.connected) return;

      const timestamp = Date.now();

      // First verify the seek locally
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        if (Math.abs(currentTime - newTime) > 0.5) {
          playerRef.current.seekTo(newTime, true);
        }
      }

      // Send immediate seek command
      socket.emit('video-control', {
        roomId: roomData.roomId,
        action: 'seek',
        time: newTime,
        videoId: videoIdRef.current,
        userId: roomData.inviterId || socket.id,
        timestamp,
        immediate: true,
      });

      // Send additional sync events for reliability
      socket.emit('creator-seek-direct', {
        roomId: roomData.roomId,
        videoId: videoIdRef.current,
        time: newTime,
        timestamp,
        immediate: true,
      });

      // Also send state update
      socket.emit('video-state-update', {
        roomId: roomData.roomId,
        videoId: videoIdRef.current,
        currentTime: newTime,
        isPlaying: playerRef.current ? 
          playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING : false,
        serverTime: timestamp,
        fromCreator: true,
        immediate: true,
      });
    }, 50) // Keep low debounce time for responsive seeking
  ).current;

  const handleSubmitUrl = (e) => {
    e.preventDefault();
    if (!videoUrl) {
      addNotification('Please enter a YouTube video URL', 'warning');
      return;
    }

    // If in a room and not the creator, disallow changing videos
    if (roomData.inRoom && !roomData.isRoomCreator) {
      
      addNotification('Only the room creator can change videos', 'warning');
      return;
    }

    // Extract the video ID from the URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      addNotification('Invalid YouTube URL', 'error');
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
            videoUrl: videoUrl,
          });
        }
      }
    }
  }; // Enhanced join video room function for better synchronization
  const joinVideoRoom = async () => {
    if (!roomData.inRoom || !roomData.roomId || !videoIdRef.current) {
      return;
    }

    // Track if we've already joined this specific video room
    const rejoining = hasJoinedVideoRoom.current === videoIdRef.current;
    if (rejoining) {
      
    }

    try {
      // Connect socket if not already connected
      if (!socket.connected) {
        socket.connect();
        // Wait for connection to establish with timeout
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, 5000)), // Timeout after 5 seconds
          new Promise((resolve) => {
            const connectHandler = () => {
              socket.off('connect', connectHandler);
              resolve();
            };
            socket.on('connect', connectHandler);
          }),
        ]);

        if (!socket.connected) {
         
          throw new Error('Socket connection timed out');
        }
      }

     

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

            // Apply the initial state immediately
            setTimeout(() => {
              if (playerRef.current) {
                // Force a sync with the initial state
                applySyncCommand(
                  {
                    action: data.videoState.isPlaying ? 'play' : 'pause',
                    time: data.videoState.currentTime || 0,
                    videoId: data.videoState.videoId,
                    serverTime: Date.now(),
                    fromCreator: true,
                  },
                  playerRef.current,
                  isRemoteUpdateRef,
                  0
                );
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
        const creatorHistory = JSON.parse(
          localStorage.getItem('roomCreatorHistory') || '{}'
        );
        const isCreatorFromHistory = creatorHistory[roomData.roomId] === true;
        const effectiveCreatorStatus =
          roomData.isRoomCreator || isCreatorFromHistory;

        // Send join request with all information - use combined creator status
        socket.emit('join-video-room', {
          roomId: roomData.roomId,
          videoId: videoIdRef.current,
          userId: roomData.inviterId || localStorage.getItem('userId'),
          username: userName,
          socketId: socket.id, // Include socket ID to help server tracking
          isCreator: effectiveCreatorStatus,
          requestInitialState: !effectiveCreatorStatus, // Request initial state if not creator
        });

        // Also use an underscore version for compatibility
        socket.emit('join_video_room', {
          roomId: roomData.roomId,
          videoId: videoIdRef.current,
          userId: roomData.inviterId || localStorage.getItem('userId'),
          username: userName,
          socketId: socket.id,
          isCreator: effectiveCreatorStatus,
          requestInitialState: !effectiveCreatorStatus, // Request initial state if not creator
        });
      });

      // Wait for join response
      await joinPromise;
      hasJoinedVideoRoom.current = videoIdRef.current;

      // Log that user joined video sync room instead of adding a chat message
      

      // If creator, send initial state to others with all types of events for redundancy
      if (roomData.isRoomCreator && playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const playerState = playerRef.current.getPlayerState();
          const isPlaying = playerState === window.YT.PlayerState.PLAYING;

          

          // Emit direct play/pause commands for immediate effect
          if (isPlaying) {
            socket.emit('creator-play-video', {
              roomId: roomData.roomId,
              videoId: videoIdRef.current,
              time: currentTime,
            });
          } else {
            socket.emit('creator-pause-video', {
              roomId: roomData.roomId,
              videoId: videoIdRef.current,
              time: currentTime,
            });
          }

          // Emit initial state to all participants using multiple event names for compatibility
          socket.emit('video-state-update', {
            roomId: roomData.roomId,
            videoId: videoIdRef.current,
            currentTime: currentTime,
            isPlaying: isPlaying,
            serverTime: Date.now(),
            fromCreator: true,
          });

          socket.emit('video_state_update', {
            roomId: roomData.roomId,
            videoId: videoIdRef.current,
            currentTime: currentTime,
            isPlaying: isPlaying,
            serverTime: Date.now(),
            fromCreator: true,
          });

          // Also send as a sync event
          socket.emit('sync-video', {
            roomId: roomData.roomId,
            videoId: videoIdRef.current,
            action: isPlaying ? 'play' : 'pause',
            time: currentTime,
            serverTime: Date.now(),
            fromCreator: true,
            forceSync: true,
          });

          // Direct video-control event
          socket.emit('video-control', {
            roomId: roomData.roomId,
            action: isPlaying ? 'play' : 'pause',
            time: currentTime,
            videoId: videoIdRef.current.getCurrentTime(),
            userId: roomData.inviterId || socket.id,
            fromCreator: true,
            forceSync: true,
          });

          
        } catch (error) {
         
        }
      }
    } catch (error) {
     

      // Try again with a delay if it failed
      setTimeout(() => {
       
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
      socketId: socket.id, // Include socket ID for better tracking
      type: 'lecture-chat', // Mark as lecture chat specifically
    };

   

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
      addNotification('Please add some notes before saving.', 'info');
      return;
    }

    // Create the note object - removed timestamp functionality
    const noteData = {
      content: notes,
      videoId: videoIdRef.current,
      videoTitle: videoTitle,
      videoUrl: videoUrl,
      // Removed videoTimestamp field
    };

    try {
      const response = await createNote(noteData);

      if (response.success) {
        // Update the local state with the new note
        setSavedNotes((prevNotes) => [response.data, ...prevNotes]);

        addNotification('Note saved successfully!', 'success');

        setNotes('');
      } else {
        addNotification(response.message || 'Failed to save note', 'error');
      }
    } catch (error) {
      addNotification('Failed to save note. Please try again.', 'error');
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
          setSavedNotes((prevNotes) =>
            prevNotes.filter((note) => note._id !== noteToDelete)
          );
          addNotification('Note deleted successfully!', 'success');
        } else {
          addNotification(response.message || 'Failed to delete note', 'error');
        }
      } catch (error) {
      
        addNotification('An error occurred while deleting note', 'error');
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
     
    }
  };

  // Function to sort notes based on criteria
  const sortNotes = (notes) => {
    if (!Array.isArray(notes)) return [];

    switch (sortCriteria) {
      case 'newest':
        return [...notes].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case 'oldest':
        return [...notes].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
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

    

    // Create debounced handler that will prevent too many sync events in a short time
    // This helps prevent video glitches when multiple sync events arrive close together
    const debouncedSyncHandler = debounce(
      (data) => {


        // Process the sync command
        applySyncCommand(data, playerRef.current, isRemoteUpdateRef);
      },
      150,
      { leading: true, trailing: true, maxWait: 300 }
    ); // Process first and last event in a burst

    // Callback for video sync events
   // Callback for video sync events
const handleVideoSync = (data) => {
  // Skip if we're the room creator and not asked to force sync
  if (
    roomData.isRoomCreator &&
    !data.isRequestedUpdate &&
    !data.forceSync
  ) {
    return;
  }

  // If player is not ready, retry with exponential backoff
  if (
    !playerRef.current ||
    typeof playerRef.current.getPlayerState !== "function"
  ) {
    const attemptSync = (attempt = 1, maxAttempts = 5) => {
      if (attempt > maxAttempts) return;

      const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
      setTimeout(() => {
        if (
          playerRef.current &&
          typeof playerRef.current.getPlayerState === "function"
        ) {
          applySyncCommand(data, playerRef.current, isRemoteUpdateRef);
        } else {
          attemptSync(attempt + 1, maxAttempts);
        }
      }, delay);
    };

    attemptSync(1);
    return;
  }

  // Fast-path for seek and creator actions
  if (data.action === "seek" || data.fromCreator) {
    applySyncCommand(data, playerRef.current, isRemoteUpdateRef);
  } else {
    debouncedSyncHandler(data);
  }
};

// Function to apply sync commands to the player
const applySyncCommand = (data, player, isRemoteUpdate, retryCount = 0) => {
  if (data.videoId !== videoIdRef.current) return;
  if (!player) {
    if (retryCount < 3) {
      setTimeout(() => {
        applySyncCommand(data, player, isRemoteUpdate, retryCount + 1);
      }, 200 * (retryCount + 1));
    }
    return;
  }

  let adjustedTime = data.time;
  if (data.action === "play" && data.serverTime) {
    const drift = Date.now() - data.serverTime;
    if (drift > 200) {
      adjustedTime += drift / 1000;
    }
  }

  isRemoteUpdate.current = true;

  try {
    switch (data.action) {
      case "play":
        player.seekTo(adjustedTime, true);
        setTimeout(() => {
          player.playVideo();
          setTimeout(() => {
            if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
              player.playVideo(); // retry
            }
          }, 200);
        }, 50);
        break;

      case "pause":
        player.seekTo(data.time, true);
        setTimeout(() => {
          player.pauseVideo();
        }, 50);
        break;

      case "seek":
        const wasPlaying =
          player.getPlayerState() === window.YT.PlayerState.PLAYING;
        player.seekTo(data.time, true);
        if (wasPlaying || data.shouldPlay) {
          setTimeout(() => {
            player.playVideo();
          }, 50);
        }
        break;

      default:
        break;
    }
  } catch (err) {
    if (retryCount < 3) {
      setTimeout(() => {
        applySyncCommand(data, player, isRemoteUpdate, retryCount + 1);
      }, 300 * (retryCount + 1));
    }
  }

  // Reset flag after delay
  setTimeout(() => {
    isRemoteUpdate.current = false;
  }, 800);
};// Callback for initial video state
    const handleVideoStateUpdate = (data) => {


      // Special handling for creator when returning from tab change
      if (
        roomData.isRoomCreator &&
        data.isRequestedUpdate &&
        data.isCreatorRequest
      ) {
        
        // Don't ignore this update, as it may be in response to our visibility change
      }
      // Normal creator behavior - ignore state updates (since creator controls video)
      else if (roomData.isRoomCreator) {
        
        return;
      }

      // Check if player and video ID match
      const player = playerRef.current;
      if (!player) {
       
        setTimeout(() => handleVideoStateUpdate(data), 1000);
        return;
      }

      if (data.videoId !== videoIdRef.current) {
        
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

          }
        }

        

        // Force a good seek first
        player.seekTo(adjustedTime, true);

        // Use longer timeout for reliability
        setTimeout(() => {
          if (data.isPlaying) {
            player.playVideo();

            // Double-check playing state after a short delay
            setTimeout(() => {
              if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                player.playVideo();
              }
            }, 1000);
          } else {
            player.pauseVideo();
          }

          // Reset flag after a delay
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
            
          }, 2000);
        }, 300);
      } catch (error) {
        
        isRemoteUpdateRef.current = false;
      }
    };

// Video control event - more reliable for initial sync
const handleVideoControl = (data) => {
  // Convert to sync format and process
  handleVideoSync({
    videoId: data.videoId,
    action: data.action,
    time: data.time,
    serverTime: Date.now(),
  });
};

// Set up listeners directly on the socket
socket.on("sync-video", handleVideoSync);
socket.on("video-control", handleVideoControl);
socket.on("video-state-update", handleVideoStateUpdate);

// Also listen to underscore versions for compatibility
socket.on("sync_video", handleVideoSync);
socket.on("video_control", handleVideoControl);
socket.on("video_state_update", handleVideoStateUpdate);

// Play event handler with improved sync
socket.on("creator-play-video", (data) => {
  if (playerRef.current && data.videoId === videoIdRef.current) {
    isRemoteUpdateRef.current = true;

    // Step 1: Seek to correct time
    playerRef.current.seekTo(data.time, true);

    // Step 2: Then play after delay
    setTimeout(() => {
      playerRef.current.playVideo();
      isRemoteUpdateRef.current = false;
    }, 200);
  }
});

// Pause event handler with improved sync
socket.on("creator-pause-video", (data) => {
  if (playerRef.current && data.videoId === videoIdRef.current) {
    isRemoteUpdateRef.current = true;

    // Step 1: Seek to correct time
    playerRef.current.seekTo(data.time, true);

    // Step 2: Then pause after delay
    setTimeout(() => {
      playerRef.current.pauseVideo();
      isRemoteUpdateRef.current = false;
    }, 200);
  }
});

// Cleanup all listeners
return () => {
  socket.off("sync-video", handleVideoSync);
  socket.off("video-control", handleVideoControl);
  socket.off("video-state-update", handleVideoStateUpdate);
  socket.off("sync_video", handleVideoSync);
  socket.off("video_control", handleVideoControl);
  socket.off("video_state_update", handleVideoStateUpdate);
  socket.off("creator-play-video");
  socket.off("creator-pause-video");
}; 
  }, [
    socket.connected,
    roomData.inRoom,
    roomData.roomId,
    roomData.isRoomCreator,
  ]);

  // Load saved chat messages
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return undefined;
    }

    // Load saved chat messages for this room and video
    const loadSavedMessages = () => {
      const storageKey = `lecture_chat_${roomData.roomId}_${
        videoIdRef.current || 'default'
      }`;
      try {
        const savedMessages = localStorage.getItem(storageKey);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          setChatMessages(parsed);

          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {

      }
    };

    loadSavedMessages();
  }, [socket.connected, roomData.inRoom, roomData.roomId, videoIdRef.current]);

  // Listen for messages from other users
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return undefined;
    }

    
    // Process function to avoid duplicates - use a Map for better tracking
    const processedMessages = new Map();
    // Handle incoming messages
    const handleReceiveMessage = (data) => {


      // Normalize data structure from different message formats
      const messageId =
        data.messageId || data.id || `${data.username}-${Date.now()}`;
      const username = data.username;
      const message = data.message || data.text;
      const timestamp = data.time || data.timestamp || Date.now();
      const isCode = data.isCode || false;

      // Skip if we've already processed this exact message
      if (processedMessages.has(messageId)) {
        return;

      }

      // Check if this is our own message coming back to us
      const isOurMessage = username === userName;

      // Look for existing message with same content (more reliable than just ID)
      const existingMessageIndex = chatMessages.findIndex(
        (msg) =>
          msg.id === messageId || // Same ID
          (msg.user === (isOurMessage ? 'You' : username) &&
            msg.text === message && // Same content
            Math.abs(new Date(msg.timestamp) - new Date(timestamp)) < 5000) // Within 5 sec
      );

      // If we find it in our history, don't show it twice
      if (existingMessageIndex !== -1) {
        return;
      }

      

      // Mark as processed with timestamp
      processedMessages.set(messageId, Date.now());

      // Limit the size of the processed messages cache to prevent memory leaks
      if (processedMessages.size > 100) {
        const oldestKey = [...processedMessages.entries()].sort(
          (a, b) => a[1] - b[1]
        )[0][0];
        processedMessages.delete(oldestKey);
      }
      // Format the message
      const newMessage = {
        id: messageId,
        user: isOurMessage ? 'You' : username,
        text: message,
        timestamp: new Date(timestamp),
        isCode: isCode,
      };
      // Add to messages and save in one operation
      setChatMessages((prevMessages) => {
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


    // Load messages using lectureRoomChatPersistence utility
    const savedMessages = loadLectureMessages(roomData.roomId);
    if (savedMessages && savedMessages.length > 0) {

      setChatMessages(savedMessages);
      setTimeout(scrollToBottom, 100);
    } else {
    }
  }, [roomData.inRoom, roomData.roomId]);

  // Simplified status indicator without text messages
  const renderControlStatusIndicator = () => {
    if (!roomData.inRoom) return null;

    // Return empty div instead of the status messages
    return null; // Remove the entire indicator component
  };

  return (
    <div className='min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white'>
      <Navbar />

      {/* Notification container with AnimatePresence for smooth transitions */}
      <div className='fixed top-20 right-4 z-50 w-72 space-y-2 pointer-events-none'>
        <AnimatePresence>
          {/* Notifications will be rendered here by the NotificationContext */}
        </AnimatePresence>
      </div>

      <div className='container mx-auto px-4 py-4 sm:py-8 relative z-10'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-4 sm:mb-6'>
          <span className='bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent'>
            Watch Together
          </span>
        </h1>
        <div className='flex flex-col lg:flex-row gap-4 sm:gap-6'>
          {/* Video Player Section */}
          <div className='w-full lg:w-2/3'>
            <div className='bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 h-full'>
              <div className='px-3 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4'>
                <form
                  onSubmit={handleSubmitUrl}
                  className='flex flex-col sm:flex-row items-center gap-2 mb-4'
                >
                  <div className='flex flex-grow w-full border border-white/20 rounded-lg overflow-hidden bg-[#2d3748]'>
                    <input
                      type='text'
                      placeholder={
                        roomData.isRoomCreator
                          ? 'YouTube URL...'
                          : 'Only creator can change videos'
                      }
                      className='flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-transparent text-white placeholder-gray-400 border-none outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2] text-sm'
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={roomData.inRoom && !roomData.isRoomCreator}
                    />
                    <button
                      type='button'
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors ${
                        roomData.inRoom && !roomData.isRoomCreator
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      onClick={() => {
                        if (roomData.inRoom && !roomData.isRoomCreator) return;
                        const clipboardText = navigator.clipboard.readText();
                        clipboardText.then((text) => setVideoUrl(text));
                      }}
                      disabled={roomData.inRoom && !roomData.isRoomCreator}
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-4 w-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type='submit'
                    className={`${
                      !roomData.isRoomCreator && roomData.inRoom
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-[#94C3D2] hover:bg-[#7EB5C3]'
                    } text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-colors shadow-md font-medium flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0`}
                    disabled={!roomData.isRoomCreator && roomData.inRoom}
                    title={
                      !roomData.isRoomCreator && roomData.inRoom
                        ? 'Only the room creator can change videos'
                        : 'Load this video'
                    }
                  >
                    Watch
                  </button>
                </form>
                {/* Show control status indicator for clearer user experience */}
                {renderControlStatusIndicator()}
              </div>
              {videoUrl ? (
                <div className='w-full border-t border-white/20'>
                  {/* IFrame will be replaced by the YouTube API */}
                  <div id='youtube-player' className='video-iframe rounded-lg'>
                    {/* This is where the player will be initialized */}
                  </div>
                  {/* Status message for users */}
                  {roomData.inRoom && (
                    <div
                      className={`mt-2 p-2 text-xs sm:text-sm rounded ${
                        roomData.isRoomCreator
                          ? 'bg-green-700/50'
                          : 'bg-yellow-600/50'
                      } text-center`}
                    >
                      {roomData.isRoomCreator
                        ? 'You are the room creator. Your video controls will be synced to all participants.'
                        : 'Video controls are disabled. Playback is synchronized with the room creator.'}
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-center justify-center h-[300px] sm:h-[400px] md:h-[600px] bg-white/5 text-gray-400 border-t border-white/20'>
                  <div className='text-center p-4'>
                    <svg
                      className='mx-auto h-10 sm:h-12 w-10 sm:w-12 text-white/30'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                    <p className='mt-2 text-sm sm:text-base'>
                      Enter a YouTube URL to begin watching
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Chat and Notes */}
          <div className='w-full lg:w-1/3 flex flex-col h-full mt-4 lg:mt-0'>
            {/* Notes Section */}
            <div className='bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 mb-4 sm:mb-6'>
              <div className='p-3 sm:p-4 border-b border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0'>
                <h2 className='font-semibold text-white/95 text-sm sm:text-base'>
                  Notes
                </h2>
                <div className='flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto'>
                  <button
                    onClick={handlePasteNotes}
                    className='px-2 sm:px-4 py-1.5 sm:py-2 bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors text-xs sm:text-sm flex-1 sm:flex-auto justify-center'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3 sm:h-4 sm:w-4 mr-1'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                      />
                    </svg>
                    Paste
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className='px-2 sm:px-4 py-1.5 sm:py-2 bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors relative text-xs sm:text-sm flex-1 sm:flex-auto justify-center'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3 sm:h-4 sm:w-4 mr-1'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      />
                    </svg>
                    View Saved
                    {savedNotes.length > 0 && (
                      <span className='absolute -top-2 -right-1 sm:-right-2 bg-[#94C3D2] text-white rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs'>
                        {savedNotes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={saveNote}
                    className='px-2 sm:px-4 py-1.5 sm:py-2 bg-[#94C3D2] hover:bg-[#7EB5C3] text-white rounded-lg flex items-center transition-colors text-xs sm:text-sm flex-1 sm:flex-auto justify-center'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3 sm:h-4 sm:w-4 mr-1'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
                      />
                    </svg>
                    Save Note
                  </button>
                </div>
              </div>
              <div className='p-0'>
                <textarea
                  className='w-full h-full p-3 sm:p-4 font-mono text-sm bg-[#2d3748] text-white focus:outline-none block resize-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none'
                  style={{
                    height: '150px',
                    minHeight: '150px',
                    maxHeight: '250px',
                  }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Take notes for this video or just general notes...'
                ></textarea>
              </div>
            </div>

            {/* Chat Section */}
            <div className='bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 flex flex-col h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px]'>
              <div className='p-3 sm:p-4 border-b border-white/20 flex justify-between items-center'>
                <div>
                  <h2 className='font-bold text-[#94c3d2] text-sm sm:text-base'>
                    Room Chat
                  </h2>
                  <p className='text-xs sm:text-sm text-white/70'>
                    Chat with your friends while watching
                  </p>
                </div>
                <div
                  className={`flex items-center ${
                    isConnected && videoUrl ? 'text-green-500' : 'text-red-400'
                  }`}
                >
                  <div
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full mr-1 sm:mr-2 ${
                      isConnected && videoUrl ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  ></div>
                  <span className='text-xs sm:text-sm'>
                    {isConnected && videoUrl ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Chat messages with responsive height */}
              <div className='flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 bg-white/5 overflow-y-auto chat-messages'>
                {chatMessages.length === 0 ? (
                  <div className='h-full flex items-center justify-center'>
                    <p className='text-gray-400'>
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {chatMessages.map((message) => {
                      // Handle system messages with a different style
                      if (
                        message.user === 'System' ||
                        message.type === 'system'
                      ) {
                        return (
                          <div key={message.id} className='flex justify-center'>
                            <div className='bg-indigo-900/30 text-indigo-200 px-3 py-2 text-xs rounded-lg border border-indigo-500/30 max-w-[80%] text-center'>
                              {message.text}
                            </div>
                          </div>
                        );
                      }
                      const isCurrentUser =
                        message.user === 'You' || message.user === userName;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] ${
                              isCurrentUser ? 'ml-auto' : ''
                            }`}
                          >
                            <div
                              className={`flex items-center ${
                                isCurrentUser ? 'justify-end' : 'justify-start'
                              } mb-1`}
                            >
                              {!isCurrentUser && (
                                <span className='font-medium text-sm text-white/90 mr-1'>
                                  {message.user}
                                </span>
                              )}
                              <span
                                className={`text-xs ${
                                  isCurrentUser
                                    ? 'text-white/90 mr-2'
                                    : 'text-white/90 ml-2'
                                }`}
                              >
                                {typeof message.timestamp === 'object'
                                  ? message.timestamp.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : new Date(
                                      message.timestamp
                                    ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                              </span>
                              {isCurrentUser && (
                                <span className='font-medium text-sm text-white/90 ml-1'>
                                  You
                                </span>
                              )}
                            </div>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isCurrentUser
                                  ? 'bg-[#94C3D2] text-white rounded-tr-none'
                                  : 'bg-yellow-50 text-black rounded-tl-none'
                              }`}
                            >
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

              <div className='p-3 sm:p-4 border-t border-white/20 bg-white/5'>
                <form
                  onSubmit={handleSendMessage}
                  className='flex items-center gap-2'
                >
                  <div className='flex-1 flex items-center bg-[#2d3748] border border-white/20 rounded-lg overflow-hidden'>
                    <input
                      type='text'
                      placeholder='Type message...'
                      className='flex-1 px-3 sm:px-4 py-2 bg-transparent text-white text-sm placeholder-gray-400 border-none outline-none'
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>                  <button
                    type='submit'
                    className='bg-[#94C3D2] hover:bg-[#7EB5C3] text-white px-4 py-2 rounded-lg transition-colors'
                    disabled={!isConnected}
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
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col border border-white/20'>
            <div className='p-4 flex justify-between items-center border-b border-white/20'>
              <h2 className='text-xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent'>Saved Notes</h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className='text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors'
              >
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            
            {/* Sorting options */}
            <div className='px-4 pt-3 pb-2 border-b border-white/20 flex flex-wrap gap-2'>
              <span className='text-white/70 mr-2 my-auto'>Sort by:</span>
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
              <div className='ml-auto text-right text-white/70 text-sm'>
                {savedNotes.length} note{savedNotes.length !== 1 ? 's' : ''} total
              </div>
            </div>
            
            <div 
              className='p-4 overflow-y-auto flex-1' 
              style={{ 
                maxHeight: 'calc(60vh - 40px)', 
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              {isLoadingNotes ? (
                <div className='flex justify-center items-center h-32'>
                  <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#94C3D2]'></div>
                  <span className='ml-2 text-white/80'>Loading notes...</span>
                </div>
              ) : savedNotes.length > 0 ? (
                <>
                  <ul className='space-y-4'>
                    {currentNotes.map(note => (
                      <li key={note._id} className='bg-white/10 p-4 rounded-lg border border-white/20'>
                        <div className='flex justify-between items-center mb-2'>
                          <div className='text-xs text-white/70'>
                            {formatDate(note.createdAt)}
                          </div>
                          <div>
                            <button
                              onClick={() => deleteNote(note._id)}
                              className='bg-red-900/50 text-red-200 border border-red-600/30 px-3 py-1 rounded font-medium hover:bg-red-900/70 transition-colors'
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {note.videoTitle && (
                          <div className='mb-2 pb-2 border-b border-white/10'>
                            <p className='text-xs font-medium text-[#94C3D2]'>Video: {note.videoTitle}</p>
                          </div>
                        )}
                        <p className='whitespace-pre-wrap text-white/95 font-medium'>{note.content}</p>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Pagination */}
                  {savedNotes.length > notesPerPage && (
                    <div className='flex justify-center mt-6 gap-2'>
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded border ${
                          currentPage === 1
                            ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                            : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
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
                          return <span key={pageNumber} className='px-2 py-1.5 text-white/50'>...</span>;
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
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className='text-white/60 text-center'>You don't have any saved notes yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className='fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50'>
          <div className='bg-gradient-to-b from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-md text-white/95 p-6 rounded-xl shadow-2xl max-w-md w-full border border-white/10'>
            <div className='border-b border-white/10 pb-3 mb-4'>
              <h3 className='text-xl font-semibold text-[#94C3D2]'>Delete Note</h3>
            </div>
            <p className='mb-6 text-white/90 leading-relaxed'>
              Are you sure you want to delete this note? This cannot be undone.
            </p>
            <div className='flex justify-end space-x-4'>
              <button 
                onClick={handleCancelDelete} 
                className='px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 rounded-lg transition-all duration-200'
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className='px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white/95 rounded-lg transition-all duration-200'
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