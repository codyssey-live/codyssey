/** 
* LECTURE ROOM PATCH FUNCTIONS
*
* This file contains updated socket handlers for the lecture room functionality
* to fix issues with chat and video synchronization. Apply these functions in 
* the appropriate files to fix the lecture room functionality.
*/

/**
 * Server-side: Updated lecture-send-message handler
 * Replace in socketService.js
 */
function improvedLectureMessageHandler(socket, io) {
  socket.on('lecture-send-message', ({ roomId, message, username, messageId, isCode }) => {
    socket.join(roomId);
    
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    
    const messageData = {
      message,
      username,
      userId: socket.id,
      time: new Date(),
      messageId,
      isCode,
      type: 'lecture-chat'
    };
    
    io.in(roomId).emit('lecture-receive-message', messageData);
    io.in(roomId).emit('lecture_receive_message', messageData);
  });
}

/**
 * Server-side: Updated send-message-with-type handler
 * Replace in socketService.js
 */
function improvedSendMessageWithType(socket, io) {
  socket.on('send-message-with-type', ({ roomId, message, username, messageId, isCode, type, socketId }) => {
   
    
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
      type
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
}

/**
 * Server-side: Updated Video Control handler with better sync
 * Replace in socketService.js
 */
function improvedHandleVideoControl(socket, { roomId, action, time, videoId, userId }, io, roomVideoStates, activeRooms, socketMap) {

  
  // Make sure socket is in the room
  socket.join(roomId);
  
  // Check if this is a valid room
  if (!activeRooms.has(roomId)) {

    // Auto-create room for more flexibility
    activeRooms.set(roomId, {
      users: new Set([socket.id]),
      createdAt: new Date()
    });
  }
  
  // Get socket data to verify if sender is room creator
  const socketData = socketMap.get(socket.id);
  if (!socketData) {
    
    // Auto-create socket data for more reliability
    socketMap.set(socket.id, {
      username: 'Unknown User',
      roomId: roomId,
      isCreator: userId ? true : false // Assume creator if userId provided
    });
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
}

/**
 * Client-side: Use these functions in LectureRoom.jsx
 * These improve chat and video sync
 */
// Import at top of LectureRoom.jsx
// import { applySyncCommand, emitVideoSync, joinVideoRoom } from '../utils/lectureRoomVideoSync';

// Replace the existing applySyncCommand function with the imported one
// Replace the video sync code in the handleVideoSync function with:
function improvedVideoSyncClient(data) {
  
  // Don't process if this is our own message and we're the creator
  if (roomData.isRoomCreator) {
    return;
  }
  
  // If player is not ready, retry with delays
  if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') {
    setTimeout(() => {
      if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        applySyncCommand(playerRef.current, data, isRemoteUpdateRef);
      } else {
        // Try one more time with a longer delay
        setTimeout(() => {
          if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
            
            applySyncCommand(playerRef.current, data, isRemoteUpdateRef);
          } else {
          
          }
        }, 2000);
      }
    }, 1000);
    return;
  }
  
  applySyncCommand(playerRef.current, data, isRemoteUpdateRef);
}

/**
 * Client-side: Use this to join the video room
 * Replace the joinVideoRoom code in LectureRoom.jsx
 */
async function improvedJoinVideoRoom() {
  if (!roomData.inRoom || !roomData.roomId || !videoIdRef.current) {
     
               
    return;
  }
  
  try {
    // Use our new utility function
    await joinVideoRoom(socket, roomData, videoIdRef.current, userName);
    
    // Add system message
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: 'System',
      text: 'Joined video sync room. The video is now synchronized with other users.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'system'
    }]);
    
    // If creator, send initial state to others
    if (roomData.isRoomCreator && playerRef.current) {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const playerState = playerRef.current.getPlayerState();
        const isPlaying = playerState === window.YT.PlayerState.PLAYING;
        
        
        
        // Use our utility function to ensure all events are sent
        emitVideoSync(
          roomData.roomId,
          isPlaying ? 'play' : 'pause',
          currentTime,
          videoIdRef.current,
          roomData.inviterId || socket.id
        );
      } catch (error) {
       
      }
    }
  } catch (error) {
   
    
    // Try again with a delay if it failed
    setTimeout(() => {
     
      joinVideoRoom();
    }, 2000);
  }
};
