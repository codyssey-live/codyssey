// videoSyncHandler.js - Enhanced video synchronization handler
import lodash from 'lodash';
const { debounce } = lodash;

// Maps to store room video state information
const roomVideoStates = new Map();
const videoSyncDebounced = new Map(); // Store debounced sync functions by room

/**
 * Handle video control events (play, pause, seek)
 * 
 * @param {Object} socket - Socket.io socket instance 
 * @param {Object} data - Event data containing roomId, action, time, videoId
 * @param {Object} io - Socket.io instance for broadcasting
 * @param {Map} activeRooms - Map of active rooms
 * @param {Map} socketMap - Map of socket data
 */
export const handleVideoControl = (socket, { roomId, action, time, videoId, userId }, io, activeRooms, socketMap) => {
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
  }
  
  // Get socket data to verify if sender is room creator
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
  
  // If not creator and trying to control, reject the control attempt
  if (!senderIsCreator) {
    console.log(`WARNING: Non-creator ${socket.id} attempting to control video in room ${roomId} - rejecting control`);
    return; // Don't propagate control events from non-creators
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
  
  // Create debounced sync function for this room if it doesn't exist
  if (!videoSyncDebounced.has(roomId)) {
    videoSyncDebounced.set(roomId, debounce((eventData, sourceSocket) => {
      // Get all clients in the room for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      console.log(`Broadcasting video-sync to room ${roomId} with ${roomSockets ? roomSockets.size : 0} clients`);
      
      // Broadcast the sync event to all OTHER users in the room
      sourceSocket.to(roomId).emit('sync-video', eventData);
      
      // Also broadcast with underscore format for compatibility
      sourceSocket.to(roomId).emit('sync_video', eventData);
      
      // Broadcast the same event to video-control handlers
      sourceSocket.to(roomId).emit('video-control', {
        ...eventData,
        userId: eventData.userId || sourceSocket.id
      });
      
      sourceSocket.to(roomId).emit('video_control', {
        ...eventData,
        userId: eventData.userId || sourceSocket.id
      });
      
      // Also broadcast to video-specific room if it exists
      if (eventData.videoId) {
        const videoRoomId = `${roomId}:${eventData.videoId}`;
        sourceSocket.join(videoRoomId); // Make sure sender is in this room too
        
        // Broadcast to all OTHER users
        sourceSocket.to(videoRoomId).emit('sync-video', eventData);
        sourceSocket.to(videoRoomId).emit('sync_video', eventData);
        sourceSocket.to(videoRoomId).emit('video-control', {
          ...eventData,
          userId: eventData.userId || sourceSocket.id
        });
        sourceSocket.to(videoRoomId).emit('video_control', {
          ...eventData,
          userId: eventData.userId || sourceSocket.id
        });
      }
    }, 100)); // 100ms debounce to prevent overwhelming the network while maintaining responsiveness
  }
  
  // Create consistent event data with server timestamp to help calculate network delay
  const eventData = {
    action,
    time,
    videoId: roomVideoStates.get(roomId).videoId,
    serverTime: Date.now(), // Add server timestamp to help calculate delay
    userId: userId || socket.id
  };
  
  // Call the debounced function
  videoSyncDebounced.get(roomId)(eventData, socket);
};

/**
 * Handle user joining video room with improved sync
 * 
 * @param {Object} socket - Socket instance
 * @param {Object} data - Join data with roomId, videoId, etc.
 * @param {Object} io - Socket.io instance 
 * @param {Map} activeRooms - Map of active rooms
 * @param {Map} socketMap - Map of socket data
 */
export const handleJoinVideoRoom = (socket, { roomId, videoId, userId, username, socketId, isCreator, requestInitialState = true }, io, activeRooms, socketMap) => {
  console.log(`${username} joining video room: ${roomId} with video: ${videoId}, socketId: ${socket.id}`);
  
  // Check if user is already in a room
  if (!activeRooms.has(roomId)) {
    // Auto-create room if it doesn't exist (more flexible approach)
    console.log(`Room ${roomId} not active, creating it for video room join`);
    activeRooms.set(roomId, {
      users: new Set([socket.id]),
      createdAt: new Date()
    });
  } else {
    // Add to existing room's user set
    activeRooms.get(roomId).users.add(socket.id);
  }
  
  // Make sure socket is in the room for regular events too
  socket.join(roomId);
  
  // Join the specific video room
  const videoRoomId = `${roomId}:${videoId}`;
  socket.join(videoRoomId);
  
  // Store video room information in socket data
  if (!socket.data) socket.data = {};
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
    
    if (videoState && videoState.videoId === videoId) {
      // Calculate current time with adjustment for paused videos
      let adjustedTime = videoState.currentTime;
      
      // If video is playing, calculate the current position based on elapsed time
      if (videoState.isPlaying && videoState.lastUpdateTime) {
        const elapsedSinceUpdate = (Date.now() - videoState.lastUpdateTime) / 1000;
        adjustedTime = videoState.currentTime + elapsedSinceUpdate;
      }
      
      // Create a state update object
      const stateUpdate = {
        videoId: videoState.videoId,
        currentTime: adjustedTime,
        isPlaying: videoState.isPlaying,
        serverTime: Date.now(),
        initialSync: true // Flag to indicate this is initial sync
      };
      
      // Send video state update with both formats for reliability
      socket.emit('video-state-update', stateUpdate);
      socket.emit('video_state_update', stateUpdate);
      
      // Include raw videoState in success response to allow client-side handling
      socket.emit('join-video-room-success', {
        success: true,
        roomId,
        videoId,
        message: 'Successfully joined video room',
        videoState: {
          ...videoState,
          currentTime: adjustedTime
        }
      });
      
      // Also send with underscore format for compatibility
      socket.emit('join_video_room_success', {
        success: true,
        roomId,
        videoId,
        message: 'Successfully joined video room',
        videoState: {
          ...videoState,
          currentTime: adjustedTime
        }
      });
      
      // Special handling for synchronization events - send appropriate sync event
      if (videoState.isPlaying) {
        // Send play sync event which is handled differently by some clients
        socket.emit('sync-video', {
          action: 'play',
          time: adjustedTime,
          videoId: videoState.videoId,
          serverTime: Date.now(),
          initialSync: true
        });
      } else {
        // For paused videos, send explicit pause event to ensure proper state
        socket.emit('sync-video', {
          action: 'pause',
          time: adjustedTime,
          videoId: videoState.videoId,
          serverTime: Date.now(),
          initialSync: true
        });
      }
      
      return; // Already sent success with videoState
    }
  }
  
  // If we reach here, either no state exists or video ID mismatch
  socket.emit('join-video-room-success', {
    success: true,
    roomId,
    videoId,
    message: 'Successfully joined video room',
    // No existing state to provide
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

/**
 * Handle request for current video state with improved tab switching support
 * 
 * @param {Object} socket - Socket instance
 * @param {Object} data - Request data
 * @param {Object} io - Socket.io instance
 */
export const handleRequestVideoState = (socket, { roomId, videoId }, io, socketMap) => {
  console.log(`Request for video state in room ${roomId} for video ${videoId} from socket ${socket.id}`);
  
  // Get user info from socket map to determine if requestor is the creator
  const isCreator = socket.data?.isCreator || (socketMap.get(socket.id)?.isCreator === true);
  
  // Check if we have state information for this room
  if (roomVideoStates.has(roomId)) {
    const videoState = roomVideoStates.get(roomId);
    
    // If the room has state for the requested video
    if (videoState && videoState.videoId === videoId) {
      // Calculate current time with adjustment for playing videos
      let adjustedTime = videoState.currentTime;
      
      // If video is playing, calculate the current position based on elapsed time
      if (videoState.isPlaying && videoState.lastUpdateTime) {
        const elapsedSinceUpdate = (Date.now() - videoState.lastUpdateTime) / 1000;
        adjustedTime = videoState.currentTime + elapsedSinceUpdate;
      }
      
      // Create a state update object
      const stateUpdate = {
        videoId: videoState.videoId,
        currentTime: adjustedTime,
        isPlaying: videoState.isPlaying,
        serverTime: Date.now(),
        isRequestedUpdate: true,
        isCreatorRequest: isCreator
      };
      
      // Send video state update with multiple formats for reliability
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
    });
  }
};

/**
 * Get the current room video states map (for module exports)
 */
export const getRoomVideoStates = () => roomVideoStates;
