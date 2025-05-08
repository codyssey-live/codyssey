import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchCurrentUser } from '../utils/authUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from '../socket'; // Import socket directly

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const instructionsRef = useRef(null);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const roomIdRef = useRef(null);
  const socketRef = useRef(null);
  const isRefreshing = useRef(false);

  const [messages, setMessages] = useState([
    { type: 'system', text: 'Welcome to the room! Share the room code with your friends to collaborate.', timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('User');
  const [participants, setParticipants] = useState(['You']);
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantsDropdownOpen, setParticipantsDropdownOpen] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [roomSessionExpired, setRoomSessionExpired] = useState(false);
  const [userId, setUserId] = useState(null);

  // Define early to avoid undefined function references
  const handleLeaveRoom = () => {
    console.log("Leaving room", roomId);
    
    // Leave the room on the socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId, username: userName });
    }
    
    // If this user is the creator, remember this for when they rejoin
    if (isRoomCreator) {
      // Save to a "room creator history" object in localStorage
      const creatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
      creatorHistory[roomId] = true;
      localStorage.setItem('roomCreatorHistory', JSON.stringify(creatorHistory));
      console.log(`Saved creator status for room ${roomId} before leaving`);
    }
    
    // Clear room information from localStorage
    localStorage.removeItem('roomInfo');
    
    // Notify Navbar that user has left the room
    window.dispatchEvent(new CustomEvent('roomLeft'));
    
    // Redirect to dashboard
    navigate('/dashboard');
    toast.info('You have left the room');
  };

  // Handle room ending - modified to delete the room directly
  const handleEndRoom = () => {
    console.log(`Ending room ${roomId} (with deletion)`);
    
    // Emit an end-room event to inform all participants
    if (socketRef.current) {
      socketRef.current.emit('end-room', { 
        roomId, 
        username: userName,
        deleteCompletely: true // Always delete completely when ending the room
      });
      
      // Listen for success response
      socketRef.current.once('end-room-success', (data) => {
        console.log("Room ended successfully:", data);
        
        // Clean up room data
        cleanupAfterRoomEnd(roomId, userName);
      });
      
      socketRef.current.once('end-room-error', (data) => {
        console.error("Error ending room:", data);
        toast.error(data.message || "Failed to end room");
      });
    } else {
      toast.error("Socket connection not available");
    }
  };
  
  // Common cleanup function for room ending
  const cleanupAfterRoomEnd = (roomId, endedBy) => {
    // Clear room information from localStorage
    localStorage.removeItem('roomInfo');
    
    // Store the ended room ID in localStorage to prevent rejoining
    const endedRooms = JSON.parse(localStorage.getItem('endedRooms') || '[]');
    if (!endedRooms.includes(roomId)) {
      endedRooms.push(roomId);
      localStorage.setItem('endedRooms', JSON.stringify(endedRooms));
    }
    
    // Also clear the creator history for this room since it no longer exists
    const creatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
    if (creatorHistory[roomId]) {
      delete creatorHistory[roomId];
      localStorage.setItem('roomCreatorHistory', JSON.stringify(creatorHistory));
    }
    
    // Remove from validated rooms if present
    const validatedRooms = JSON.parse(localStorage.getItem('validatedRooms') || '[]');
    const updatedValidatedRooms = validatedRooms.filter(id => id !== roomId);
    localStorage.setItem('validatedRooms', JSON.stringify(updatedValidatedRooms));
    
    // Notify Navbar that room has ended
    window.dispatchEvent(new CustomEvent('roomLeft'));
    
    // Redirect to dashboard
    navigate('/dashboard');
    toast.success(endedBy ? `Room ended by ${endedBy}` : 'Room ended');
  };

  // Check if user has a valid room session with time validation
  useEffect(() => {
    console.log("Validating room session for:", roomId);
    
    const validateRoomSession = () => {
      // First check if this room was previously ended
      const endedRooms = JSON.parse(localStorage.getItem('endedRooms') || '[]');
      if (endedRooms.includes(roomId)) {
        console.log("Room was previously ended");
        toast.error("This room has been ended and is no longer available");
        navigate('/dashboard');
        return false;
      }
      
      const roomInfo = localStorage.getItem('roomInfo');
      console.log("Room info from localStorage:", roomInfo);
      
      if (!roomInfo) {
        console.log("No room info found - direct URL access attempt");
        toast.error("Direct room access is not allowed. Please join through the dashboard.");
        navigate('/dashboard');
        return false;
      }
      
      try {
        const parsedInfo = JSON.parse(roomInfo);
        console.log("Parsed room info:", parsedInfo);
        
        // Check if the room session has expired (24 hours)
        const createdOrJoinedAt = new Date(parsedInfo.createdAt || parsedInfo.joinedAt).getTime();
        const currentTime = new Date().getTime();
        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (currentTime - createdOrJoinedAt > SESSION_DURATION) {
          console.log("Room session expired");
          setRoomSessionExpired(true);
          toast.error("Your room session has expired. Please create or join a new room.");
          handleLeaveRoom();
          return false;
        }
        
        // Check if this is the requested room
        if (parsedInfo.roomId !== roomId) {
          console.log("Room ID mismatch - attempting to access unauthorized room");
          toast.error("You don't have access to this room");
          navigate('/dashboard');
          return false;
        }
        
        // Check if user is the creator from roomInfo OR from roomCreatorHistory
        const creatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
        const wasCreator = creatorHistory[roomId] === true;
        
        // Set isRoomCreator based on current roomInfo OR previous history as creator
        setIsRoomCreator(!!parsedInfo.isCreator || wasCreator);
        console.log("User is room creator:", !!parsedInfo.isCreator || wasCreator);
        
        return true;
      } catch (error) {
        console.error('Error parsing room info:', error);
        navigate('/dashboard');
        return false;
      }
    };
    
    if (!validateRoomSession()) {
      return;
    }
    
    // Continue with the rest of the setup if session is valid
    const fetchUserData = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user && user._id) {
          setUserId(user._id);
        }
      } catch (err) {
        console.error('Failed to fetch user ID:', err);
      }
    };
    
    fetchUserData();
    
  }, [roomId, navigate]);

  // Socket connection and event handling
  useEffect(() => {
    const beforeUnloadHandler = () => {
      isRefreshing.current = true;
    };
    
    // Add listener to detect page refreshes
    window.addEventListener('beforeunload', beforeUnloadHandler);
    
    const getUserData = async () => {
      let username;
      
      // Try to restore username from localStorage first
      const savedUsername = localStorage.getItem('roomUsername');
      
      try {
        const user = await fetchCurrentUser();
        if (user && user.name) {
          username = user.name;
          // Save username for persistence across refreshes
          localStorage.setItem('roomUsername', username);
        } else if (savedUsername) {
          // Use saved username if API didn't return a name
          username = savedUsername;
        } else {
          // Generate a persistent guest name
          const guestName = `Guest-${Math.floor(Math.random() * 1000)}`;
          username = guestName;
          localStorage.setItem('roomUsername', guestName);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        if (savedUsername) {
          username = savedUsername;
        } else {
          // Generate a persistent guest name
          const guestName = `Guest-${Math.floor(Math.random() * 1000)}`;
          username = guestName;
          localStorage.setItem('roomUsername', guestName);
        }
      }
      
      // Set the username in state
      setUserName(username);
      console.log(`Using username: ${username}`);
      
      // Now handle socket connection
      handleSocketConnection(username);
    };
    
    const handleSocketConnection = (username) => {
      // Ensure socket is disconnected before reconnecting to prevent duplicates
      if (socket.connected) {
        console.log('Socket already connected, disconnecting first to prevent duplicate');
        socket.disconnect();
      }
      
      // Store socket reference for later use
      socketRef.current = socket;
      
      // Define setup function
      const setupOnce = () => {
        console.log(`Socket connected with ID: ${socket.id}, setting up for user: ${username}`);
        setupConnection(username);
        socket.off('connect', setupOnce); // Remove listener after first connection
      };
      
      // Connect socket and set up handler
      socket.connect();
      socket.on('connect', setupOnce);
    };

    getUserData();

    return () => {
      // Clean up event listeners
      if (socketRef.current) {
        console.log('Cleaning up socket event listeners');
        socketRef.current.off('user-joined');
        socketRef.current.off('receive-message');
        socketRef.current.off('user-left');
        socketRef.current.off('room_data');
        socketRef.current.off('receive_message');
        socket.off('connect');
        
        // Only leave room when component unmounts and NOT during page refresh
        if (userName && roomId && !isRefreshing.current) {
          console.log(`Leaving room ${roomId} as ${userName}`);
          socketRef.current.emit('leave-room', { roomId, username: userName });
        }
        
        // Disconnect to prevent duplicate connections
        socketRef.current.disconnect();
      }
      
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [roomId]);

  // Add message cache to prevent duplicate messages
  const processedMessages = useRef(new Map()); // Changed from Set to Map
  const messageIdCounter = useRef(0);
  const joinedTimestamp = useRef(Date.now());
  const recentJoins = useRef(new Map()); // Track recent joins to suppress immediate leaves
  
  const setupConnection = (username) => {
    if (!socketRef.current) {
      console.error('Socket not initialized');
      setLoading(false);
      toast.error("Couldn't connect to chat server");
      return;
    }
    
    // Clear event listeners to prevent duplicates
    socketRef.current.off('user-joined');
    socketRef.current.off('user_joined'); // Add underscore version
    socketRef.current.off('receive-message');
    socketRef.current.off('receive_message');
    socketRef.current.off('user-left');
    socketRef.current.off('user_left'); // Add underscore version
    socketRef.current.off('room_data');
    
    console.log(`Joining room ${roomId} as ${username} with socket ID: ${socketRef.current.id}`);
    
    // Join the room
    socketRef.current.emit('join-room', {
      roomId,
      username
    });

    // Also emit underscore version for compatibility
    socketRef.current.emit('join_room', {
      roomId,
      username
    });
    
    // Listen for user joined events
    socketRef.current.on('user-joined', (data) => {
      console.log('User joined event received:', data);
      
      // Skip own join notifications
      if (data.username === username) return;
      
      // Record this join to filter potential immediate leave messages
      recentJoins.current.set(data.username, Date.now());
      
      // Add a join message to the chat
      addSystemMessage(`${data.username} joined the room`, `join:${data.username}`);
      
      // Always update participants
      if (data.participants) {
        console.log('Setting participants list:', data.participants);
        setParticipants(data.participants);
      }
    });
    
    // Also listen for underscore version
    socketRef.current.on('user_joined', (data) => {
      console.log('User_joined event received (underscore):', data);
      
      // Skip own join notifications
      if (data.username === username) return;
      
      // Record this join to filter potential immediate leave messages
      recentJoins.current.set(data.username, Date.now());
      
      // Add a join message to the chat
      addSystemMessage(`${data.username} joined the room`, `join:${data.username}`);
      
      // Always update participants
      if (data.participants) {
        console.log('Setting participants list from underscore event:', data.participants);
        setParticipants(data.participants);
      }
    });
    
    // Listen for messages from other users with deduplication
    socketRef.current.on('receive-message', (data) => {
      console.log('Received message event:', data);
      
      // Only process messages from others (our own messages are added locally)
      if (data.username !== username) {
        setMessages(prev => [...prev, {
          type: 'user',
          text: data.message,
          user: data.username,
          timestamp: new Date(data.time)
        }]);
      }
    });
    
    // Also listen for the underscore version of events
    socketRef.current.on('receive_message', (data) => {
      console.log('Received message (underscore format):', data);
      
      // Only process messages from others (our own messages are added locally)
      if (data.username !== username) {
        setMessages(prev => [...prev, {
          type: 'user',
          text: data.text,
          user: data.username,
          timestamp: new Date(data.timestamp)
        }]);
      }
    });
    
    // Listen for user left events with strict filtering
    socketRef.current.on('user-left', (data) => {
      console.log('User left event received:', data);
      
      // Skip own leave notifications
      if (data.username === username) return;
      
      // Check if this is a leave message shortly after joining (likely a refresh)
      const recentJoinTime = recentJoins.current.get(data.username);
      const now = Date.now();
      
      if (recentJoinTime && now - recentJoinTime < 10000) { // 10 seconds threshold
        console.log(`Filtering leave message for ${data.username} - too soon after join`);
        // Still update participants without showing the message
        if (data.participants) {
          setParticipants(data.participants);
        }
        return;
      }
      
      // Add a leave message to the chat
      const leaveMessage = `${data.username} left the room`;
      const messageKey = `leave:${data.username}`;
      addSystemMessage(leaveMessage, messageKey);
      
      // Always update participants
      if (data.participants) {
        console.log('Updated participants after leave:', data.participants);
        setParticipants(data.participants);
      }
    });
    
    // Also listen for underscore version of user left with same filtering
    socketRef.current.on('user_left', (data) => {
      console.log('User_left event received (underscore):', data);
      
      // Skip own leave notifications
      if (data.username === username) return;
      
      // Check if this is a leave message shortly after joining (likely a refresh)
      const recentJoinTime = recentJoins.current.get(data.username);
      const now = Date.now();
      
      if (recentJoinTime && now - recentJoinTime < 10000) { // 10 seconds threshold
        console.log(`Filtering underscore leave message for ${data.username} - too soon after join`);
        // Still update participants without showing the message
        if (data.participants) {
          setParticipants(data.participants);
        }
        return;
      }
      
      // Add a leave message to the chat WITH a specific key to prevent duplicates
      const leaveMessage = `${data.username} left the room`;
      const messageKey = `leave:${data.username}`;
      addSystemMessage(leaveMessage, messageKey);
      
      // Always update participants
      if (data.participants) {
        console.log('Updated participants after leave (underscore):', data.participants);
        setParticipants(data.participants);
      }
    });

    // Listen for direct room data events
    socketRef.current.on('room_data', (data) => {
      console.log('Room data event received:', data);
      if (data.participants) {
        console.log('Setting participants from room_data:', data.participants);
        setParticipants(data.participants);
      }
    });

    // Setup for room-ended event - update to use common cleanup
    socketRef.current.on('room-ended', (data) => {
      console.log("Room ended event received:", data);
      toast.info(`Room was ended by ${data.username}`);
      
      // Use the common cleanup function
      cleanupAfterRoomEnd(roomId, data.username);
    });
    
    setLoading(false);
    console.log('Socket connection setup complete');
  };

  // A dedicated function to handle deduplication of system messages with longer time window
  const addSystemMessage = (text, key = null) => {
    // Time-based deduplication - increasing to 10 seconds for better filtering
    const now = Date.now();
    const messageKey = key || text;
    const lastTime = processedMessages.current.get(messageKey) || 0;
    
    // Only add if it's been more than 10 seconds since the last identical message
    if (now - lastTime > 10000) {
      processedMessages.current.set(messageKey, now);
      setMessages(prev => [...prev, {
        type: 'system',
        text,
        timestamp: new Date()
      }]);
    } else {
      console.log('Duplicate system message filtered:', text);
    }
  };

  // Effect to match chat height with instructions height
  useEffect(() => {
    if (instructionsRef.current && chatRef.current) {
      const updateHeight = () => {
        const instructionsHeight = instructionsRef.current.offsetHeight;
        chatRef.current.style.height = `${instructionsHeight}px`;
      };
      
      // Initial height update
      updateHeight();
      
      // Use ResizeObserver to track height changes
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(instructionsRef.current);
        
        return () => resizeObserver.disconnect();
      } else {
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
      }
    }
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    // Generate unique message ID
    const messageId = `${socketRef.current.id}-${messageIdCounter.current++}`;
    
    const messageData = {
      roomId,
      message: newMessage,
      username: userName,
      messageId // Add message ID to allow deduplication
    };

    console.log('Sending message:', messageData);
    
    // Send message using the correct event name
    socketRef.current.emit('send-message', messageData);
    
    // Add the message to local state right away (for immediate feedback)
    setMessages(prev => [...prev, {
      type: 'user',
      text: newMessage,
      user: userName,
      timestamp: new Date(),
      messageId
    }]);
    
    setNewMessage('');
  };

  const handleCopyRoomId = () => {
    // Copy just the room ID, not a full URL
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setCopySuccess(true);
        toast.success('Room ID copied to clipboard!');
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy room ID:', err);
        toast.error('Failed to copy room ID');
      });
  };

  const handleCopyInviteLink = () => {
    // Copy just the room ID, not a full URL
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setInviteLinkCopied(true);
        toast.success('Room code copied to clipboard!');
        setTimeout(() => setInviteLinkCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy room ID:', err);
        toast.error('Failed to copy room code');
      });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#E8F1F7]">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      
      {roomSessionExpired ? (
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Room Session Expired</h2>
            <p className="text-gray-700 mb-6">Your session for this room has expired. Room sessions are valid for 24 hours.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#94C3D2] text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          {/* Room Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Codyssey Hub</h1>
                <p className="text-gray-600 mt-1">Room Code: <span className="font-semibold">{roomId}</span></p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={handleCopyInviteLink}
                  className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center w-full md:w-auto min-w-[140px]"
                  title="Copy room code to clipboard"
                >
                  {inviteLinkCopied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{color: 'white'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{color: 'white'}}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{color: 'white'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span style={{color: 'white'}}>Copy Room Code</span>
                    </>
                  )}
                </button>
                
                {/* Leave Room button for ALL users */}
                <button
                  onClick={handleLeaveRoom}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center w-full md:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Leave Room
                </button>
                
                {/* End Room button only for room creators */}
                {isRoomCreator && (
                  <button
                    onClick={() => {
                      if(confirm("Are you sure you want to end this room? This will delete the room permanently and cannot be undone.")) {
                        handleEndRoom();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center w-full md:w-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    End Room
                  </button>
                )}
                
                <div className="relative w-full md:w-auto">
                  <button 
                    onClick={() => setParticipantsDropdownOpen(!participantsDropdownOpen)}
                    className="flex items-center justify-center bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors w-full min-w-[140px]"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                    <span>{participants.length} Online</span>
                    <svg className="w-4 h-4 ml-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {participantsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 py-1 border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
                      <div className="px-3 py-2 border-b border-gray-100">
                        <h3 className="font-semibold text-sm text-gray-800">Participants</h3>
                      </div>
                      <ul className="max-h-48 overflow-y-auto">
                        {participants.length > 0 ? (
                          participants.map((participant, index) => (
                            <li key={index} className="px-3 py-2 hover:bg-gray-50 flex items-center">
                              <div className="bg-white border border-gray-200 h-6 w-6 rounded-full flex items-center justify-center text-gray-700 font-bold text-xs mr-2">
                                {participant.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-700">{participant}</span>
                              <span className="h-2 w-2 bg-green-500 rounded-full ml-auto"></span>
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-sm text-gray-500 text-center">
                            No participants yet
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Instructions and Links Section */}
            <div ref={instructionsRef} className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Room Instructions</h2>
              
              <div className="space-y-6">
                <div className="bg-[#F0F9FF] rounded-lg p-4 border border-blue-100">
                  <h3 className="font-bold text-gray-800 flex items-center text-lg">
                    <span className="bg-[#94C3D2] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 text-sm">1</span>
                    Go to Syllabus
                  </h3>
                  <p className="text-gray-700 mt-2">Create or customize your learning path</p>
                  <Link 
                    to="/syllabus" 
                    className="mt-3 bg-[#94C3D2] text-white px-4 py-2 rounded inline-flex items-center text-sm hover:bg-opacity-90 transition-colors"
                  >
                    Open Syllabus
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                <div className="bg-[#F0F9FF] rounded-lg p-4 border border-blue-100">
                  <h3 className="font-bold text-gray-800 flex items-center text-lg">
                    <span className="bg-[#94C3D2] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 text-sm">2</span>
                    Solve Problems Together
                  </h3>
                  <div className="text-gray-700 mt-2">
                    <p><strong>Important:</strong> Open the Collab Room directly from the Syllabus page.</p>
                    <p className="mt-2">This allows you to properly track problems and mark them as:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Solved</span>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">Unsolved</span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">Solve Later</span>
                    </div>
                  </div>
                  <div className="mt-3 text-amber-700 text-sm bg-amber-50 p-2 rounded border border-amber-200">
                    Opening Collab Room from Syllabus ensures proper problem tracking
                  </div>
                </div>
                
                <div className="bg-[#F0F9FF] rounded-lg p-4 border border-blue-100">
                  <h3 className="font-bold text-gray-800 flex items-center text-lg">
                    <span className="bg-[#94C3D2] text-white w-7 h-7 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 text-sm">3</span>
                    Watch Videos Together
                  </h3>
                  <div className="text-gray-700 mt-2">
                    <p><strong>Important:</strong> Open the Lecture Room directly from the Syllabus page.</p>
                    <p className="mt-2">This allows you to access specific topic videos and see whether they are:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Single videos</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Video playlists</span>
                    </div>
                  </div>
                  <div className="mt-3 text-amber-700 text-sm bg-amber-50 p-2 rounded border border-amber-200">
                    Video type information is only available from the Syllabus page
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat Section - Now taking full width */}
            <div ref={chatRef} className="bg-[#dbeafe] rounded-lg shadow-md flex flex-col lg:col-span-3">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-800">Room Chat</h2>
                  <p className="text-sm text-gray-600">Chat with your friends in real-time</p>
                </div>
                <div className={`flex items-center ${loading ? 'text-yellow-500' : 'text-green-500'}`}>
                  <div className={`h-2.5 w-2.5 rounded-full mr-2 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm">{loading ? 'Connecting...' : 'Connected'}</span>
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto bg-[#E8F1F7]">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <div key={index} className={`${message.type === 'system' ? 'flex justify-center' : 'flex'}`}>
                        {message.type === 'system' ? (
                          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                            {message.text}
                            <span className="ml-2 text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                          </div>
                        ) : (
                          <div className={`max-w-[85%] ${message.user === userName ? 'ml-auto' : ''}`}>
                            <div className={`flex items-center ${message.user === userName ? 'justify-end' : ''} mb-1`}>
                              <span className="text-xs text-gray-500 mr-2">{formatTime(message.timestamp)}</span>
                              <span className="font-medium text-sm">{message.user}</span>
                            </div>
                            <div className={`rounded-lg px-4 py-2 ${message.user === userName ? 'bg-[#94C3D2] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                              {message.text}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className={`${loading ? 'bg-gray-400' : 'bg-[#94C3D2]'} text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors`}
                    disabled={loading}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
