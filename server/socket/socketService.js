import { Server } from 'socket.io';

let io;
// Track room participants by roomId -> Map of username -> connection count
const roomUsers = new Map();
// Track socket connections by socketId -> {username, roomId}
const socketMap = new Map();
// Store the last activity timestamps to prevent duplicate notifications
const lastActivity = new Map();

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
    
    // Handle both join-room and join_room events (for compatibility)
    const handleJoinRoom = ({ roomId, username }) => {
      console.log(`${username} joining room: ${roomId} (socket ${socket.id})`);
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Store user information
      socket.data.username = username;
      socket.data.roomId = roomId;
      
      // Initialize room if needed
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      
      const roomUserMap = roomUsers.get(roomId);
      
      // Add this user to the room
      roomUserMap.set(username, (roomUserMap.get(username) || 0) + 1);
      
      // Get current participants list
      const participants = Array.from(roomUserMap.keys());
      
      console.log(`Room ${roomId} participants:`, participants);
      
      // Emit both kebab-case and snake_case events for compatibility
      // Let others know someone joined
      socket.to(roomId).emit('user-joined', { 
        username, 
        message: `${username} has joined the room`,
        userId: socket.id,
        time: new Date(),
        participants
      });
      
      // Also emit underscore version
      socket.to(roomId).emit('user_joined', { 
        username,
        participants,
        message: `${username} has joined the room` 
      });
      
      // Send updated participants to everyone
      io.to(roomId).emit('room_data', { participants });
    };
    
    // Register both event names for compatibility
    socket.on('join-room', handleJoinRoom);
    socket.on('join_room', handleJoinRoom);

    // Handle chat messages
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

    // Update the disconnect handler to emit both event types
    socket.on('disconnect', () => {
      // Get user data from our mapping
      const userData = socketMap.get(socket.id);
      
      if (userData) {
        const { username, roomId } = userData;
        
        if (roomUsers.has(roomId)) {
          const roomUserMap = roomUsers.get(roomId);
          
          if (roomUserMap.has(username)) {
            const connectionsCount = roomUserMap.get(username) - 1;
            
            if (connectionsCount <= 0) {
              // User has fully left the room
              roomUserMap.delete(username);
              
              // Prevent duplicate leave notifications
              const now = Date.now();
              const lastLeave = lastActivity.get(`${username}:leave:${roomId}`) || 0;
              const leaveThreshold = 5000; // 5 seconds
              
              if (now - lastLeave > leaveThreshold) {
                // Get updated participants
                const participants = Array.from(roomUserMap.keys());
                
                // Notify room that user left
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
                console.log(`${username} disconnected from room ${roomId}`);
                
                // Update everyone's participant list
                io.to(roomId).emit('room_data', { participants });
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
    
    // Handle both leave-room and leave_room events
    const handleLeaveRoom = ({ roomId, username }) => {
      socket.leave(roomId);
      
      if (roomUsers.has(roomId)) {
        const roomUserMap = roomUsers.get(roomId);
        
        if (roomUserMap.has(username)) {
          const connectionsCount = roomUserMap.get(username) - 1;
          
          if (connectionsCount <= 0) {
            // User has fully left the room
            roomUserMap.delete(username);
            
            // Get updated participants
            const participants = Array.from(roomUserMap.keys());
            
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
      socketMap.delete(socket.id);
      socket.data.roomId = null;
      socket.data.username = null;
    };
    
    socket.on('leave-room', handleLeaveRoom);
    socket.on('leave_room', handleLeaveRoom);
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

