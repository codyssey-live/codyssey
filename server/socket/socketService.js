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
    
    // Handle join-room event
    socket.on('join-room', async ({ roomId, username }) => {
      console.log(`${username} joining room: ${roomId} (socket ${socket.id})`);
      
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
        
        // Track this socket
        socketMap.set(socket.id, { 
          username, 
          roomId
        });
        
        // Initialize room users if needed
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }
        
        const roomUserMap = roomUsers.get(roomId);
        roomUserMap.set(username, (roomUserMap.get(username) || 0) + 1);
        
        // Get participants list
        const participants = Array.from(roomUserMap.keys());
        
        // Notify others in the room
        socket.to(roomId).emit('user-joined', { 
          username,
          participants,
          time: new Date()
        });
        
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
    });
    
    // Handle send-message event
    socket.on('send-message', ({ roomId, message, username, messageId }) => {
      console.log(`Message in room ${roomId} from ${username}: ${message}`);
      
      // Broadcast to all users in the room EXCEPT the sender
      socket.to(roomId).emit('receive-message', {
        message,
        username,
        userId: socket.id,
        time: new Date(),
        messageId
      });
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
            
            // Prevent duplicate leave notifications
            const now = Date.now();
            const lastLeave = lastActivity.get(`${username}:leave:${roomId}`) || 0;
            const leaveThreshold = 5000; // 5 seconds
            
            if (now - lastLeave > leaveThreshold) {
              // Notify everyone in the room
              io.to(roomId).emit('user-left', {
                username,
                message: `${username} has left the room`,
                userId: socket.id,
                time: new Date(),
                participants
              });
              
              io.to(roomId).emit('user_left', {
                username,
                message: `${username} has left the room`,
                userId: socket.id,
                time: new Date(),
                participants
              });
              
              lastActivity.set(`${username}:leave:${roomId}`, now);
            }
            
            console.log(`${username} left room: ${roomId}`);
            
            // Send updated participant list
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
              
              // Prevent duplicate leave notifications
              const now = Date.now();
              const lastLeave = lastActivity.get(`${username}:leave:${roomId}`) || 0;
              const leaveThreshold = 5000; // 5 seconds
              
              if (now - lastLeave > leaveThreshold) {
                // Notify everyone in the room
                io.to(roomId).emit('user-left', {
                  username,
                  message: `${username} has left the room`,
                  userId: socket.id,
                  time: new Date(),
                  participants
                });
                
                io.to(roomId).emit('user_left', {
                  username,
                  message: `${username} has left the room`,
                  userId: socket.id,
                  time: new Date(),
                  participants
                });
                
                lastActivity.set(`${username}:leave:${roomId}`, now);
              }
              
              console.log(`${username} left room: ${roomId}`);
              
              // Send updated participant list
              io.to(roomId).emit('room_data', { participants });
              
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

