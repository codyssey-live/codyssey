import { Server } from 'socket.io';
import Room from '../models/Room.js';

let io;
// Map to store active rooms with metadata (roomId -> {users})
const activeRooms = new Map();
// Track room participants by roomId -> Map of username -> connection count
const roomUsers = new Map();
// Track socket connections by socketId -> {username, roomId}
const socketMap = new Map();
// Store the last activity timestamps to prevent duplicate notifications
const lastActivity = new Map();
// Set to store permanently ended room IDs that cannot be rejoined
const endedRooms = new Set();
// Initialize maps for video state tracking
const roomVideoStates = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle video control events
    socket.on('video-control', (data) => {
      handleVideoControl(socket, data, io, roomVideoStates, activeRooms, socketMap);
    });
    
    socket.on('video_control', (data) => {
      handleVideoControl(socket, data, io, roomVideoStates, activeRooms, socketMap);
    });
    
    // Handle joining video room
    socket.on('join-video-room', (data) => {
      handleJoinVideoRoom(socket, data, io, roomVideoStates, activeRooms, socketMap);
    });
    
    socket.on('join_video_room', (data) => {
      handleJoinVideoRoom(socket, data, io, roomVideoStates, activeRooms, socketMap);
    });
    
    // Handle request for current video state (especially after tab visibility change)
    socket.on('request-video-state', (data) => {
      handleRequestVideoState(socket, data, io, roomVideoStates);
    });
      
    // Handle join-room event
    socket.on('join-room', async ({ roomId, username, isCreator }) => {
      console.log(`${username} joining room: ${roomId} (socket ${socket.id})${isCreator ? ' as CREATOR' : ''}`);
      
      // Input validation
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('join-room-error', {
          success: false,
          message: 'Invalid room ID format'
        });
        return;
      }
      
      // Check if room has been ended
      if (endedRooms.has(roomId)) {
        socket.emit('join-room-error', {
          success: false,
          message: 'This room has been ended and is no longer available'
        });
        return;
      }

      try {
        // First check if room is active in memory
        if (!activeRooms.has(roomId)) {
          // If not in memory, check database
          const roomExists = await Room.findOne({ roomId, active: true });
          if (!roomExists) {
            socket.emit('join-room-error', {
              success: false,
              message: 'Room not found or is no longer active'
            });
            return;
          }
          
          // Initialize room in memory
          activeRooms.set(roomId, {
            users: new Set([socket.id]),
            createdAt: new Date()
          });
        } else {
          // Add user to existing room
          const roomData = activeRooms.get(roomId);
          roomData.users.add(socket.id);
        }

        // Join the room
        socket.join(roomId);
        
        // Store user information
        socket.data.username = username;
        socket.data.roomId = roomId;
          // Track this socket - include isCreator if specified
        socketMap.set(socket.id, { 
          username, 
          roomId,
          isCreator: !!isCreator // Store creator status in socket map
        });
        
        // Initialize room users if needed
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }
        
        const roomUserMap = roomUsers.get(roomId);
        roomUserMap.set(username, (roomUserMap.get(username) || 0) + 1);
        
        // Get participants list
        const participants = Array.from(roomUserMap.keys());
        
        // Send success response to the user who joined
        socket.emit('join-room-success', {
          success: true,
          roomId,
          message: 'Successfully joined the room',
          participants
        });
        
        // Send room data to all users in the room
        io.to(roomId).emit('room_data', { 
          participants
        });
      } catch (error) {
        console.error(`Error joining room: ${error.message}`);
        socket.emit('join-room-error', {
          success: false,
          message: 'Server error while joining room'
        });
      }
    });      // Handle send-message event    
    socket.on('send-message', ({ roomId, message, username, messageId, source, isCode }) => {
      console.log(`Message in room ${roomId} from ${username}: ${message}, source: ${source}`);
      
      // Create message object
      const messageData = {
        message,
        username,
        userId: socket.id,
        time: new Date(),
        messageId,
        source,
        isCode
      };
      
      // Broadcast to others in the room
      socket.to(roomId).emit('receive-message', messageData);
    });
    
    // Handle lecture room specific message event
    socket.on('lecture-send-message', ({ roomId, message, username, messageId, isCode }) => {
      console.log(`Lecture message in room ${roomId} from ${username}: ${message}`);
      
      // Make sure the socket joins the room itself if not joined already
      socket.join(roomId);
      
      // Log all sockets in the room for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      console.log(`Room ${roomId} has ${roomSockets ? roomSockets.size : 0} sockets connected`);
      
      // Map socket IDs in room for debug
      if (roomSockets) {
        console.log(`Socket IDs in room: ${Array.from(roomSockets).join(', ')}`);
      }
      
      // Create a standardized message object
      const messageData = {
        message,
        username,
        userId: socket.id,
        time: new Date(),
        messageId,
        isCode,
        type: 'lecture-chat'
      };
      
      // Force broadcast to ALL users in the room INCLUDING sender for reliability
      io.in(roomId).emit('lecture-receive-message', messageData);
      
      // Also emit with underscore format for compatibility
      io.in(roomId).emit('lecture_receive_message', messageData);
      
      // Log the broadcast
      console.log(`Broadcasted lecture message to all ${roomSockets ? roomSockets.size : 0} clients in room ${roomId}`);
    });
    
    // Also handle underscore version for compatibility
    socket.on('lecture_send_message', ({ roomId, message, username, messageId, isCode }) => {
      console.log(`Lecture message in room ${roomId} from ${username}: ${message} (underscore format)`);
      
      // Make sure socket is in the room
      socket.join(roomId);
      
      // Create consistent message object
      const messageObject = {
        message,
        username,
        userId: socket.id,
        time: new Date(),
        messageId,
        isCode
      };
      
      // Broadcast to ALL users including sender using io.in
      io.in(roomId).emit('lecture-receive-message', messageObject);      // Also emit with underscore format for compatibility
      io.in(roomId).emit('lecture_receive_message', messageObject);
    });
    
    // Handle message with type parameter for more flexibility
    socket.on('send-message-with-type', ({ roomId, message, username, messageId, isCode, type, socketId, source }) => {
      console.log(`Typed message (${type}) in room ${roomId} from ${username}, source: ${source}`);
      
      // Make sure the socket joins the room
      socket.join(roomId);
      
      // Create message object
      const messageData = {
        message,
        username,
        userId: socket.id,
        time: new Date(),
        messageId,
        isCode,
        type,
        source
      };
      
      // Broadcast appropriate event based on message type
      // Use io.in() to include sender in broadcast
      if (type === 'lecture-chat') {
        io.in(roomId).emit('lecture-receive-message', messageData);
      } else {
        // Default to standard chat message
        socket.to(roomId).emit('receive-message', messageData);
      }
    });
    
    // SIMPLIFIED - Allow any user to end the room
    socket.on('end-room', async ({ roomId, username, deleteCompletely = true }) => {
      console.log(`Request to end room ${roomId} by ${username} (socket ${socket.id})`);
      
      if (!roomId || !activeRooms.has(roomId)) {
        socket.emit('end-room-error', {
          success: false,
          message: 'Room not found'
        });
        return;
      }
      
      try {
        // Always delete the room from the database
        const result = await Room.findOneAndDelete({ roomId });
        
        if (!result) {
          console.log(`No room found with ID ${roomId} in database to delete`);
        } else {
          console.log(`Room ${roomId} completely deleted from database`);
        }
        
        // Notify all users in the room
        io.to(roomId).emit('room-ended', {
          roomId,
          username,
          message: 'Room has been ended'
        });
        
        // Add to ended rooms set
        endedRooms.add(roomId);
        
        // Remove room data from memory
        roomUsers.delete(roomId);
        activeRooms.delete(roomId);
        
        // Get all sockets in the room
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
              socket.leave(roomId);
            }
          }
        }
        
        // Confirm to the user that the room was ended
        socket.emit('end-room-success', {
          success: true,
          message: 'Room deleted successfully'
        });
        
        console.log(`Room ${roomId} ended successfully by ${username}`);
      } catch (error) {
        console.error(`Error ending room: ${error.message}`);
        socket.emit('end-room-error', {
          success: false, 
          message: 'Server error while ending room'
        });
      }
    });

    // Handle leave-room event
    socket.on('leave-room', ({ roomId, username }) => {
      console.log(`${username} leaving room: ${roomId} (socket ${socket.id})`);
      
      // Check if room exists
      if (!activeRooms.has(roomId)) {
        console.log(`Room ${roomId} does not exist, cannot leave`);
        return;
      }
      
      // Remove socket from room
      socket.leave(roomId);
      
      // Remove socket from room's user set
      const roomData = activeRooms.get(roomId);
      roomData.users.delete(socket.id);
      
      // Remove from socketMap
      socketMap.delete(socket.id);
      
      if (roomUsers.has(roomId)) {
        const roomUserMap = roomUsers.get(roomId);
        
        if (roomUserMap.has(username)) {
          const connectionsCount = roomUserMap.get(username) - 1;
          
          if (connectionsCount <= 0) {
            // User has fully left the room
            roomUserMap.delete(username);
            
            // Get updated participants
            const participants = Array.from(roomUserMap.keys());
            
            // Only update the participant list without a message
            io.to(roomId).emit('room_data', { participants });
          } else {
            // User still has other connections
            roomUserMap.set(username, connectionsCount);
            console.log(`${username} still has ${connectionsCount} connections to room ${roomId}`);
          }
        }
      }
      
      // Update socket mapping
      socket.data.roomId = null;
      socket.data.username = null;
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
      // Get user data from our mapping
      const userData = socketMap.get(socket.id);
      
      if (userData) {
        const { username, roomId } = userData;
        
        // Remove socket from room's user set if room exists
        if (activeRooms.has(roomId)) {
          const roomData = activeRooms.get(roomId);
          roomData.users.delete(socket.id);
          
          // Check if room is empty and should be deleted
          if (roomData.users.size === 0) {
            console.log(`Room ${roomId} is empty, cleaning up`);
            activeRooms.delete(roomId);
          }
        }
        
        if (roomUsers.has(roomId)) {
          const roomUserMap = roomUsers.get(roomId);
          
          if (roomUserMap.has(username)) {
            const connectionsCount = roomUserMap.get(username) - 1;
            
            if (connectionsCount <= 0) {
              // User has fully left the room
              roomUserMap.delete(username);
              
              // Get updated participants
              const participants = Array.from(roomUserMap.keys());
              
              // Only update the participant list
              io.to(roomId).emit('room_data', { participants });
              
              console.log(`${username} left room: ${roomId}`);
              
              // If room is empty after this user left, clean it up
              if (participants.length === 0) {
                console.log(`Room ${roomId} has no more participants, cleaning up`);
                roomUsers.delete(roomId);
                activeRooms.delete(roomId);
              }
            } else {
              // User still has other connections
              roomUserMap.set(username, connectionsCount);
              console.log(`${username} still has ${connectionsCount} connections to room ${roomId}`);
            }
          }
        }
        
        // Clean up socket mapping
        socketMap.delete(socket.id);
      } else {
        console.log(`User disconnected: ${socket.id} (no user data)`);
      }
    });
  });

  return io;
};

// Helper to get io instance elsewhere
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Handle video sync events from creator
const handleVideoControl = (socket, { roomId, action, time, videoId, userId }, io, roomVideoStates, activeRooms, socketMap) => {
  console.log(`Video control event from ${userId || socket.id} in room ${roomId}: ${action} at ${time} for video ${videoId}`);
  
  // Make sure socket is in the room
  socket.join(roomId);
  
  // Check if this is a valid room
  if (!activeRooms.has(roomId)) {
    console.log(`Room ${roomId} not found for video sync, creating it`);
    // Auto-create room for more flexibility
    activeRooms.set(roomId, {
      users: new Set([socket.id]),
      createdAt: new Date()
    });
  }  // Get socket data to verify if sender is room creator
  const socketData = socketMap.get(socket.id);
  if (!socketData) {
    console.log(`No socket data found for ${socket.id}, adding basic data`);
    // Auto-create socket data for more reliability
    socketMap.set(socket.id, {
      username: 'Unknown User',
      roomId: roomId,
      isCreator: userId ? true : false // Assume creator if userId provided
    });
  }
  
  // Check if sender has control permissions (is creator)
  const senderIsCreator = socketData?.isCreator || false;
  
  // Log permission status for debugging
  console.log(`${socket.id} has creator status: ${senderIsCreator}, controlling video: ${action}`);
  
  // If not creator and trying to control, log warning but continue (client-side will block UI)
  if (!senderIsCreator) {
    console.log(`WARNING: Non-creator ${socket.id} attempting to control video in room ${roomId}`);
  }
  
  // Store/update video state for the room
  if (!roomVideoStates.has(roomId)) {
    roomVideoStates.set(roomId, { 
      videoId, 
      currentTime: time, 
      isPlaying: action === 'play',
      lastSeekTime: action === 'seek' ? time : undefined,
      lastUpdateTime: Date.now()
    });
  } else {
    const videoState = roomVideoStates.get(roomId);
    videoState.currentTime = time;
    videoState.isPlaying = action === 'play';
    if (action === 'seek') {
      videoState.lastSeekTime = time;
    }
    videoState.lastUpdateTime = Date.now();
    if (videoId) {
      videoState.videoId = videoId;
    }
  }
  
  // Get all clients in the room for debugging
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  console.log(`Broadcasting video-sync to room ${roomId} with ${roomSockets ? roomSockets.size : 0} clients`);
  
  // Create consistent event data with server timestamp to help calculate network delay
  const eventData = {
    action,
    time,
    videoId: roomVideoStates.get(roomId).videoId,
    serverTime: Date.now() // Add server timestamp to help calculate delay
  };

  // Broadcast the sync event to all OTHER users in the room
  socket.to(roomId).emit('sync-video', eventData);
  
  // Also broadcast with underscore format for maximum compatibility
  socket.to(roomId).emit('sync_video', eventData);
  
  // Broadcast the same event to video-control handlers
  socket.to(roomId).emit('video-control', {
    ...eventData,
    userId: userId || socket.id
  });
  
  socket.to(roomId).emit('video_control', {
    ...eventData,
    userId: userId || socket.id
  });
  
  // Also broadcast to video-specific room if it exists
  if (videoId) {
    const videoRoomId = `${roomId}:${videoId}`;
    socket.join(videoRoomId); // Make sure sender is in this room too
    
    // Broadcast to all OTHER users
    socket.to(videoRoomId).emit('sync-video', eventData);
    socket.to(videoRoomId).emit('sync_video', eventData);
    socket.to(videoRoomId).emit('video-control', {
      ...eventData,
      userId: userId || socket.id
    });
    socket.to(videoRoomId).emit('video_control', {
      ...eventData,
      userId: userId || socket.id
    });
  }
};

// Handle user joining video room
const handleJoinVideoRoom = (socket, { roomId, videoId, userId, username, socketId, isCreator }, io, roomVideoStates, activeRooms, socketMap) => {
  console.log(`${username} joining video room: ${roomId} with video: ${videoId}, socketId: ${socket.id}`);
  
  // Check if user is already in a room
  if (!activeRooms.has(roomId)) {
    // Auto-create room if it doesn't exist (more flexible approach)
    console.log(`Room ${roomId} not active, creating it for video room join`);
    activeRooms.set(roomId, {
      users: new Set([socket.id]),
      createdAt: new Date()
    });
    
    // Also ensure room users is initialized
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
  }
  
  // Make sure socket is in the room for regular events too
  socket.join(roomId);
  
  // Join the specific video room
  const videoRoomId = `${roomId}:${videoId}`;
  socket.join(videoRoomId);
  
  // Store video room information in socket data
  if (!socket.data.videoRooms) {
    socket.data.videoRooms = new Set();
  }
  socket.data.videoRooms.add(videoRoomId);
    // Store essential user info in socketMap for later reference
  // If existing socket data, preserve creator status if it's set to true
  const existingSocketData = socketMap.get(socket.id);
  const existingCreatorStatus = existingSocketData?.isCreator;
  
  socketMap.set(socket.id, {
    username: username || 'Unknown User',
    roomId: roomId,
    // Allow creator status to be passed in or preserved from previous setting
    isCreator: isCreator || existingCreatorStatus || false
  });
  
  // Log creator status for debugging
  console.log(`Socket ${socket.id} has creator status: ${socketMap.get(socket.id).isCreator}`);
  
  // If there's existing state for this room, send it to the new user
  if (roomVideoStates.has(roomId)) {
    const videoState = roomVideoStates.get(roomId);
    if (videoState.videoId === videoId) {
      // Send video state update with both formats for reliability
      socket.emit('video-state-update', {
        videoId: videoState.videoId,
        currentTime: videoState.currentTime,
        isPlaying: videoState.isPlaying,
        serverTime: Date.now()
      });
      
      socket.emit('video_state_update', {
        videoId: videoState.videoId,
        currentTime: videoState.currentTime,
        isPlaying: videoState.isPlaying,
        serverTime: Date.now()
      });
    }
  }
  
  // Send successful join response
  socket.emit('join-video-room-success', {
    success: true,
    roomId,
    videoId,
    message: 'Successfully joined video room'
  });
  
  // Also send with underscore format for compatibility
  socket.emit('join_video_room_success', {
    success: true,
    roomId,
    videoId,
    message: 'Successfully joined video room'
  });
  
  // Notify others that someone joined the video room
  socket.to(videoRoomId).emit('user-joined-video-room', {
    username,
    roomId,
    videoId,
    socketId: socket.id,
    isCreator
  });
};

// Handle request for current video state with improved tab switching support
const handleRequestVideoState = (socket, { roomId, videoId }, io, roomVideoStates) => {
  console.log(`Request for video state in room ${roomId} for video ${videoId} from socket ${socket.id}`);
  
  // Get user info from socket map to determine if requestor is the creator
  const isCreator = socket.data?.isCreator || (socketMap.get(socket.id)?.isCreator === true);
  
  // Check if we have state information for this room
  if (roomVideoStates.has(roomId)) {
    const videoState = roomVideoStates.get(roomId);
    
    // If the room has state for the requested video
    if (videoState && videoState.videoId === videoId) {
      console.log(`Sending current video state: playing=${videoState.isPlaying}, time=${videoState.currentTime}, to ${isCreator ? 'CREATOR' : 'viewer'}`);
      
      // Calculate adjusted time based on elapsed time since last update
      let adjustedTime = videoState.currentTime;
      if (videoState.isPlaying) {
        // If the video was playing, account for time that has passed
        const elapsedSeconds = (Date.now() - videoState.lastUpdateTime) / 1000;
        adjustedTime = videoState.currentTime + elapsedSeconds;
      }
      
      // Send state update to the requesting client only
      const stateUpdate = {
        videoId: videoState.videoId,
        currentTime: adjustedTime,
        isPlaying: videoState.isPlaying,
        serverTime: Date.now(),
        isRequestedUpdate: true, // Flag to indicate this is a response to a request
        isCreatorRequest: isCreator // Let client know if creator requested this update
      };
      
      // Send with both formats for compatibility
      socket.emit('video-state-update', stateUpdate);
      socket.emit('video_state_update', stateUpdate);
      
      // Special handling for synchronization events
      if (videoState.isPlaying) {
        // Send play sync event which is handled differently by some clients
        socket.emit('sync-video', {
          action: 'play',
          time: adjustedTime,
          videoId: videoState.videoId,
          serverTime: Date.now(),
          isRequestedUpdate: true,
          isCreatorRequest: isCreator
        });
      } else {
        // For paused videos, send explicit pause event to ensure proper state
        socket.emit('sync-video', {
          action: 'pause',
          time: adjustedTime,
          videoId: videoState.videoId,
          serverTime: Date.now(),
          isRequestedUpdate: true,
          isCreatorRequest: isCreator
        });
      }
    } else {
      console.log(`No state found for video ${videoId} in room ${roomId}`);
      socket.emit('video-state-not-found', {
        roomId,
        videoId,
        message: 'No state found for this video'
      });
    }
  } else {
    console.log(`No video state for room ${roomId}`);
    socket.emit('video-state-not-found', {
      roomId,
      videoId,
      message: 'No state found for this room'
    });  }
};

