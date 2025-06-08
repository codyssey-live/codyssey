import { Server } from 'socket.io';
import Room from '../models/Room.js';
import { handleVideoControl, handleJoinVideoRoom, handleRequestVideoState, getRoomVideoStates } from './videoSyncHandler.js';

let io;
// Map to store active rooms with metadata (roomId -> {users})
const activeRooms = new Map();
// Track room participants by roomId -> Map of username -> connection count
const roomUsers = new Map();
// Track socket connections by socketId -> {username, roomId}
const socketMap = new Map();
// Store the last activity timestamps to prevent duplicate notifications
const lastActivity = new Map();
// Store problem details by roomId for collaboration rooms
const roomProblemDetails = new Map();
// Set to store permanently ended room IDs that cannot be rejoined
const endedRooms = new Set();
// Use the shared video states from the handler
const roomVideoStates = getRoomVideoStates();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  io.on('connection', (socket) => {
    
    // Handle problem details sharing for collaboration rooms
    socket.on('share-problem-details', ({ roomId, problemDetails, dayId, problemId }) => {
      
      if (!roomId || !problemDetails) {
        return;
      }
      
      // Store the problem details for this room
      roomProblemDetails.set(roomId, {
        details: problemDetails,
        dayId,
        problemId,
        sharedBy: socket.id,
        sharedAt: new Date()
      });
      
      // Broadcast the problem details to all users in the room (except sender)
      socket.to(roomId).emit('problem-details', {
        problemDetails,
        dayId,
        problemId
      });
      
    });
      // Handle sharing problem status updates between participants
    socket.on('share-problem-status', ({ roomId, status, dayId, problemId, problemTitle }) => {
      
      if (!roomId || !status || !problemId) {
        return;
      }
      
      // Get the username from socket data
      const socketData = socketMap.get(socket.id);
      const username = socketData ? socketData.username : 'A participant';
      
      // Broadcast the status update to all users in the room
      socket.to(roomId).emit('problem-status-update', {
        status,
        dayId,
        problemId,
        problemTitle,
        username,
        fromSocketId: socket.id,
        timestamp: new Date()
      });
      
    });
    
    // Handle requests for problem details from newly joined users
    socket.on('request-problem-details', ({ roomId }) => {
      
      if (!roomId) {
        return;
      }
      
      const storedDetails = roomProblemDetails.get(roomId);
      
      if (storedDetails) {
        // Send the stored problem details directly to the requester
        socket.emit('problem-details', {
          problemDetails: storedDetails.details,
          dayId: storedDetails.dayId,
          problemId: storedDetails.problemId
        });
        
      } else {
        // If no details are stored yet, try to find a room creator to request them from
        const roomCreator = Array.from(socketMap.entries())
          .find(([_, userData]) => userData.roomId === roomId && userData.isCreator);
          
        if (roomCreator) {
          const [creatorSocketId] = roomCreator;
          
          // Send a request to the room creator's socket
          io.to(creatorSocketId).emit('request-problem-details', {
            roomId,
            requestedBy: socket.id
          });
        }
      }
    });
      // Handle video control events with enhanced handlers
    socket.on('video-control', (data) => {
      handleVideoControl(socket, data, io, activeRooms, socketMap);
    });
    
    socket.on('video_control', (data) => {
      handleVideoControl(socket, data, io, activeRooms, socketMap);
    });
      // Handle joining video room with enhanced sync
    socket.on('join-video-room', (data) => {
      // Pass correct parameters to match the imported function signature
      handleJoinVideoRoom(socket, data, io, activeRooms, socketMap);
    });
    
    socket.on('join_video_room', (data) => {
      // Pass correct parameters to match the imported function signature
      handleJoinVideoRoom(socket, data, io, activeRooms, socketMap);
    });
    
    // Handle request for current video state (especially after tab visibility change)
    socket.on('request-video-state', (data) => {
      handleRequestVideoState(socket, data, io, socketMap);
    });
      
    // Handle join-room event
    socket.on('join-room', async ({ roomId, username, isCreator }) => {
      
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
        socket.emit('join-room-error', {
          success: false,
          message: 'Server error while joining room'
        });
      }
    });      // Handle send-message event    
    socket.on('send-message', ({ roomId, message, username, messageId, source, isCode }) => {
      
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
      
      // Make sure the socket joins the room itself if not joined already
      socket.join(roomId);
      
      // Log all sockets in the room for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      
      // Map socket IDs in room for debug
      if (roomSockets) {
<<<<<<< Updated upstream
=======
        // console.log(`Socket IDs in room: ${Array.from(roomSockets).join(', ')}`);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
      // console.log(`Broadcasted lecture message to all ${roomSockets ? roomSockets.size : 0} clients in room ${roomId}`);
>>>>>>> Stashed changes
    });
    
    // Also handle underscore version for compatibility
    socket.on('lecture_send_message', ({ roomId, message, username, messageId, isCode }) => {
      
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
      // Handle room-end requests with proper owner verification
    socket.on('end-room', async ({ roomId, username, userId, deleteCompletely = true }) => {
      
      if (!roomId || !activeRooms.has(roomId)) {
        socket.emit('end-room-error', {
          success: false,
          message: 'Room not found'
        });
        return;
      }
      
      try {
        // Find the room first to verify ownership
        const room = await Room.findOne({ roomId });
        
        if (!room) {
          socket.emit('end-room-error', {
            success: false,
            message: 'Room not found in database'
          });
          return;
        }
        
        // Verify that the requesting user is the creator of the room
        if (!userId || room.inviterId.toString() !== userId.toString()) {
          socket.emit('end-room-error', {
            success: false,
            message: 'You are not authorized to end this room'
          });
          return;
        }
        
        // Delete the room after ownership verification
        await Room.findOneAndDelete({ roomId });
        
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
        roomProblemDetails.delete(roomId);
        
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
        
      } catch (error) {
        socket.emit('end-room-error', {
          success: false,
          message: 'Failed to end room'
        });
      }
    });

    // Handle leave-room event
    socket.on('leave-room', ({ roomId, username }) => {
      
      // Check if room exists
      if (!activeRooms.has(roomId)) {
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
<<<<<<< Updated upstream
                            
=======
              
>>>>>>> Stashed changes
              // If room is empty after this user left, clean it up
              if (participants.length === 0) {
                roomUsers.delete(roomId);
                activeRooms.delete(roomId);
              }
            } else {
              // User still has other connections
              roomUserMap.set(username, connectionsCount);
            }
          }
        }
        
        // Clean up socket mapping
        socketMap.delete(socket.id);
<<<<<<< Updated upstream
      } else {
      }
=======
      } 
>>>>>>> Stashed changes
    });
  });

  return io;
};

// Helper to get io instance elsewhere
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }  return io;
};
  // REMOVED: Local implementation of handleVideoControl 
// This function was removed in favor of using the imported handleVideoControl from videoSyncHandler.js

// REMOVED: Local implementation of handleRequestVideoState
// Using the imported handleRequestVideoState from videoSyncHandler.js instead

