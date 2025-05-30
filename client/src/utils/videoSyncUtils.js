import socket from '../socket';

// Video synchronization functions
export const joinVideoRoom = (roomId, videoId, userId, username) => {
  return new Promise((resolve, reject) => {
    // Set up one-time event listeners for success and error
    const onSuccess = (data) => {
      socket.off('join-video-room-success', onSuccess);
      socket.off('join-video-room-error', onError);
      resolve(data);
    };
    
    const onError = (error) => {
      socket.off('join-video-room-success', onSuccess);
      socket.off('join-video-room-error', onError);
      reject(error);
    };
    
    // Set up listeners
    socket.on('join-video-room-success', onSuccess);
    socket.on('join-video-room-error', onError);
    
    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Send join request
    socket.emit('join-video-room', {
      roomId,
      videoId,
      userId,
      username
    });
  });
};

export const emitVideoControl = (roomId, action, time, videoId, userId) => {
  socket.emit('video-control', {
    roomId,
    action, // 'play', 'pause', or 'seek'
    time,   // Current video time in seconds
    videoId,
    userId  // Used to verify if sender is creator
  });
};

// Video sync event listeners
export const setupVideoSyncListeners = (onSync, onStateUpdate) => {
  // Listen for sync events from server
  socket.on('sync-video', onSync);
  
  // Listen for initial state when joining a video
  socket.on('video-state-update', onStateUpdate);
  
  // Return cleanup function
  return () => {
    socket.off('sync-video', onSync);
    socket.off('video-state-update', onStateUpdate);
  };
};
