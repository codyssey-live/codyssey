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

  const [messages, setMessages] = useState([
    { type: 'system', text: 'Welcome to the room! Share the room link with your friends to collaborate.', timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('User');
  const [participants, setParticipants] = useState(['You']);
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantsDropdownOpen, setParticipantsDropdownOpen] = useState(false);

  // Check if user has a valid room session
  useEffect(() => {
    const roomInfo = localStorage.getItem('roomInfo');
    
    if (!roomInfo) {
      toast.error("You don't have access to this room");
      navigate('/dashboard');
      return;
    }
    
    try {
      const parsedInfo = JSON.parse(roomInfo);
      if (parsedInfo.roomId !== roomId) {
        // If the user is trying to access a different room than their active one
        localStorage.setItem('roomInfo', JSON.stringify({
          ...parsedInfo,
          roomId: roomId,
          updatedAt: new Date().toISOString()
        }));
        
        // Dispatch event to notify Navbar that room has been joined
        window.dispatchEvent(new CustomEvent('roomJoined'));
      }
    } catch (error) {
      console.error('Error parsing room info:', error);
      navigate('/dashboard');
    }
  }, [roomId, navigate]);

  // Socket connection and event handling
  useEffect(() => {
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
        
        // Leave room when component unmounts
        if (userName && roomId) {
          console.log(`Leaving room ${roomId} as ${userName}`);
          socketRef.current.emit('leave-room', { roomId, username: userName });
        }
        
        // Disconnect to prevent duplicate connections
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  // Add message cache to prevent duplicate messages
  const processedMessages = useRef(new Map()); // Changed from Set to Map
  const messageIdCounter = useRef(0);
  const joinedTimestamp = useRef(Date.now());
  
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
      
      // Add a join message to the chat
      addSystemMessage(`${data.username} joined the room`);
      
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
      
      // Add a join message to the chat
      addSystemMessage(`${data.username} joined the room`);
      
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
    
    // Listen for user left events
    socketRef.current.on('user-left', (data) => {
      console.log('User left event received:', data);
      
      // Add a leave message to the chat
      addSystemMessage(`${data.username} left the room`);
      
      // Always update participants
      if (data.participants) {
        console.log('Updated participants after leave:', data.participants);
        setParticipants(data.participants);
      }
    });
    
    // Also listen for underscore version of user left
    socketRef.current.on('user_left', (data) => {
      console.log('User_left event received (underscore):', data);
      
      // Add a leave message to the chat
      addSystemMessage(`${data.username} left the room`);
      
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
    
    setLoading(false);
    console.log('Socket connection setup complete');
  };

  // A dedicated function to handle deduplication of system messages
  const addSystemMessage = (text) => {
    // Simple time-based deduplication (1 second)
    const now = Date.now();
    const key = text;
    const lastTime = processedMessages.current.get(key) || 0;
    
    // Only add if it's been more than 1 second since the last identical message
    if (now - lastTime > 1000) {
      processedMessages.current.set(key, now);
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
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setInviteLinkCopied(true);
        toast.success('Invite link copied to clipboard!');
        setTimeout(() => setInviteLinkCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy invite link:', err);
        toast.error('Failed to copy invite link');
      });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#E8F1F7]">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Room Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Codyssey Hub</h1>
              <p className="text-gray-600 mt-1">Room ID: <span className="font-semibold">{roomId}</span></p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
              {/* Copy Room ID button removed */}
              
              <button
                onClick={handleCopyInviteLink}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center w-full md:w-auto min-w-[140px]"
                title="Copy invite link to share with friends"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span style={{color: 'white'}}>Invite Friends</span>
                  </>
                )}
              </button>
              
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
    </div>
  );
};

export default Room;
