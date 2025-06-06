// LectureRoom video sync utility functions for enhanced synchronization
import socket from '../socket';

/**
 * Emit video control event with multiple formats for better reliability
 * 
 * @param {string} roomId - The room ID
 * @param {string} action - 'play', 'pause', or 'seek'
 * @param {number} time - Current video time in seconds
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID (usually room creator)
 */
export const emitVideoSync = (roomId, action, time, videoId, userId) => {
  // Use hyphen format
  socket.emit('video-control', {
    roomId: roomId,
    action: action,
    time: time,
    videoId: videoId,
    userId: userId
  });
  
  // Use underscore format for compatibility
  socket.emit('video_control', {
    roomId: roomId,
    action: action,
    time: time,
    videoId: videoId,
    userId: userId
  });
  
  // Use sync-video format with server time
  socket.emit('sync-video', {
    roomId: roomId,
    action: action,
    time: time,
    videoId: videoId,
    serverTime: Date.now()
  });
  
  // Also send complete state update
  socket.emit('video-state-update', {
    roomId: roomId,
    videoId: videoId,
    currentTime: time,
    isPlaying: action === 'play',
    serverTime: Date.now()
  });

  console.log(`Emitted video ${action} at ${time} for room ${roomId}`);
};

/**
 * Apply sync command to YouTube player with advanced seek verification
 * 
 * @param {Object} player - YouTube player instance
 * @param {Object} data - Sync data from server
 * @param {Function} callback - Optional callback after sync is done
 * @param {boolean} isRemoteUpdate - Flag to prevent recursive events
 */
export const applySyncCommand = (player, data, isRemoteUpdateRef, callback = null) => {
  if (!player || typeof player.getCurrentTime !== 'function') {
    console.error('Invalid player for sync command');
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
    isRemoteUpdateRef.current = true;
    
    // Apply the sync action with better handling of time position
    switch (data.action) {
      case 'play':
        console.log(`Syncing: play at ${adjustedTime}`);
        
        // Force accurate seek first, then play with reliable timing
        player.seekTo(adjustedTime, true);
        
        // Wait for seek to complete, using a tiered verification approach
        let seekCheckAttempts = 0;
        const verifySeekAndPlay = () => {
          const currentPos = player.getCurrentTime();
          
          // Check if we're at the expected position
          if (Math.abs(currentPos - adjustedTime) > 2) {
            if (seekCheckAttempts < 3) {
              seekCheckAttempts++;
              console.log(`Seek verification failed on attempt ${seekCheckAttempts}. Expected: ${adjustedTime}, Got: ${currentPos}. Trying again...`);
              player.seekTo(adjustedTime, true);
              setTimeout(verifySeekAndPlay, 150);
            } else {
              console.log(`Giving up on precise seeking after ${seekCheckAttempts} attempts. Playing now.`);
              player.playVideo();
            }
          } else {
            console.log(`Seek successful after ${seekCheckAttempts + 1} attempts. Now at ${currentPos}, expected ${adjustedTime}`);
            player.playVideo();
            
            // Verify playing state after a short delay
            setTimeout(() => {
              if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                console.log("Play verification failed. Playing again.");
                player.playVideo();
              }
            }, 300);
          }
        };
        
        // Start the verification process
        setTimeout(verifySeekAndPlay, 200);
        break;
        
      case 'pause':
        console.log(`Syncing: pause at ${data.time}`);
        
        // Ensure we pause at the exact position
        player.seekTo(data.time, true);
        
        // Wait briefly to ensure seek completes
        setTimeout(() => {
          player.pauseVideo();
          console.log('Paused at position', player.getCurrentTime());
        }, 150);
        break;
        
      case 'seek':
        console.log(`Syncing: seek to ${data.time}`);
          // First pause the video to ensure consistent seeking behavior
        player.pauseVideo();
        
        // Wait a brief moment to ensure pause takes effect
        setTimeout(() => {
          // Store initial state for better debugging
          const initialState = player.getPlayerState();
          const initialPos = player.getCurrentTime();
          console.log(`Initial state before seek: state=${initialState}, position=${initialPos}, target=${data.time}`);
          
          // More reliable seeking with verification
          player.seekTo(data.time, true);
          
          // Verify seek worked with better handling of the reset-to-zero issue
          let seekVerifyAttempts = 0;
          const maxSeekAttempts = 5; // More attempts for better reliability
          
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
                const retryDelay = 150 + (seekVerifyAttempts * 50); // Progressive delay
                console.log(`Seek verification failed on attempt ${seekVerifyAttempts}. Expected: ${data.time}, Got: ${currentPos}. Trying again in ${retryDelay}ms...`);
                player.seekTo(data.time, true);
                setTimeout(verifySeek, retryDelay);              } else {
                console.log(`Still couldn't get exact seek position after ${maxSeekAttempts} attempts. Best position: ${currentPos}, expected: ${data.time}`);
                // Force one final seek with a larger timeout
                setTimeout(() => {
                  player.seekTo(data.time, true);
                  
                  // Final verification and cleanup
                  setTimeout(() => {
                    const finalPos = player.getCurrentTime();
                    console.log(`Final position after all attempts: ${finalPos}, target was: ${data.time}`);
                  }, 300);
                }, 300);
              }
            } else {
              console.log(`Seek successful on attempt ${seekVerifyAttempts + 1}, now at ${currentPos}, expected: ${data.time}`);
              
              // One final seek to be absolutely sure
              if (Math.abs(currentPos - data.time) > 0.5) {
                player.seekTo(data.time, true);
              }
            }
          };
          
          // Start verification process
          setTimeout(verifySeek, 200);
        }, 150);
        break;
    }
    
    // Reset flag after a reasonable delay
    const resetDelay = Math.min(2000, 500 + (data.time * 2));
    setTimeout(() => {
      isRemoteUpdateRef.current = false;
      console.log('Remote update flag reset, allowing local control events');
      
      // Call callback if provided
      if (callback) callback();
    }, resetDelay);
    
  } catch (error) {
    console.error('Error applying sync command:', error);
    isRemoteUpdateRef.current = false;
  }
};

/**
 * Join a video room with enhanced reliability
 * 
 * @param {Object} socket - Socket.io instance 
 * @param {Object} roomData - Room data including roomId
 * @param {string} videoId - YouTube video ID
 * @param {string} userName - User's name
 * @returns {Promise} Promise that resolves when joined
 */
export const joinVideoRoom = (socket, roomData, videoId, userName) => {
  return new Promise((resolve, reject) => {
    if (!roomData.inRoom || !roomData.roomId || !videoId || !socket.connected) {
      return reject(new Error('Missing required data for video room join'));
    }

    try {
      console.log(`Joining video room: ${roomData.roomId} for video: ${videoId}`);
      
      // Create a promise to wait for server response
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
      
      // Set timeout to avoid hanging
      const timeout = setTimeout(() => {
        socket.off('join-video-room-success', onSuccess);
        socket.off('join-video-room-error', onError);
        reject(new Error('Join video room request timed out'));
      }, 5000);
      
      // Set up listeners
      socket.once('join-video-room-success', (data) => {
        clearTimeout(timeout);
        onSuccess(data);
      });
      
      socket.once('join-video-room-error', (error) => {
        clearTimeout(timeout);
        onError(error);
      });
      
      // Send join requests in multiple formats for compatibility
      const joinData = {
        roomId: roomData.roomId,
        videoId: videoId,
        userId: roomData.inviterId || socket.id,
        username: userName,
        socketId: socket.id,
        isCreator: roomData.isRoomCreator
      };
      
      socket.emit('join-video-room', joinData);
      socket.emit('join_video_room', joinData);
      
    } catch (error) {
      reject(error);
    }
  });
};
