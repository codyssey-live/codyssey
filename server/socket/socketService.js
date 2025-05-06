import { Server } from 'socket.io';

let io;
// Track room participants
const roomUsers = new Map();

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

    // Handle room joining
    socket.on('join-room', ({ roomId, username }) => {
      console.log(`${username} joining room: ${roomId}`);
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Store user information with the socket
      socket.data.username = username;
      socket.data.roomId = roomId;
      
      // Initialize room users set if needed
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      
      // Add user to room participants
      roomUsers.get(roomId).add(username);
      
      // Get current participants list
      const participants = Array.from(roomUsers.get(roomId));
      console.log(`Room ${roomId} participants after join:`, participants);
      
      // Broadcast to everyone (INCLUDING the sender) that user joined
      io.to(roomId).emit('user-joined', { 
        username, 
        message: `${username} has joined the room`,
        userId: socket.id,
        time: new Date(),
        participants
      });
      
      // Also emit current participants with room_data event 
      io.to(roomId).emit('room_data', { participants });
    });

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

    // Handle user disconnection
    socket.on('disconnect', () => {
      const { username, roomId } = socket.data;
      
      if (roomId && username && roomUsers.has(roomId)) {
        console.log(`${username} disconnected from room ${roomId}`);
        
        // Remove user from room participants
        roomUsers.get(roomId).delete(username);
        
        // Get updated participants
        const participants = Array.from(roomUsers.get(roomId));
        console.log(`Room ${roomId} participants after disconnect:`, participants);
        
        // Notify room that user left
        io.to(roomId).emit('user-left', {
          username,
          message: `${username} has left the room`,
          userId: socket.id,
          time: new Date(),
          participants
        });
      } else {
        console.log(`User disconnected: ${socket.id}`);
      }
    });
    
    // Handle user leaving room
    socket.on('leave-room', ({ roomId, username }) => {
      console.log(`${username} leaving room: ${roomId}`);
      socket.leave(roomId);
      
      // Remove from room tracking
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(username);
        
        // Get updated participants
        const participants = Array.from(roomUsers.get(roomId));
        console.log(`Room ${roomId} participants after leave:`, participants);
        
        // Notify everyone in the room
        io.to(roomId).emit('user-left', {
          username,
          message: `${username} has left the room`,
          userId: socket.id,
          time: new Date(),
          participants
        });
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

