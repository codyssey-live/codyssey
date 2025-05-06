import { Server } from 'socket.io';

let io;
// Track room participants by roomId -> Map of username -> Set of socketId
const roomUsers = new Map();
// Track socket connections by socketId -> {username, roomId}
const socketMap = new Map();

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

    // Ensure we don't have duplicate connection handlers
    socket.removeAllListeners('join-room');
    socket.removeAllListeners('send-message');
    socket.removeAllListeners('disconnect');
    socket.removeAllListeners('leave-room');

    // Handle room joining
    socket.on('join-room', ({ roomId, username }) => {
      console.log(`${username} joining room: ${roomId} (socket ${socket.id})`);
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Store user information with socket data
      socket.data.username = username;
      socket.data.roomId = roomId;
      
      // Store in our socket mapping
      socketMap.set(socket.id, { username, roomId });
      
      // Initialize room if it doesn't exist
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      
      // Store socket ID for this username in this room
      const roomUserMap = roomUsers.get(roomId);
      if (!roomUserMap.has(username)) {
        roomUserMap.set(username, new Set());
      }
      
      // Add this socket ID to the user's socket set
      roomUserMap.get(username).add(socket.id);
      
      // Get unique participants list (just usernames)
      const participants = Array.from(roomUserMap.keys());
      
      console.log(`Room ${roomId} participants after join:`, participants);
      
      // Broadcast to everyone that user joined with updated participants
      io.to(roomId).emit('user-joined', { 
        username, 
        message: `${username} has joined the room`,
        userId: socket.id,
        time: new Date(),
        participants
      });
      
      // Also send room data with participants list
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
      // Get user data from our mapping
      const userData = socketMap.get(socket.id);
      
      if (userData) {
        const { username, roomId } = userData;
        
        console.log(`${username} disconnected from room ${roomId} (socket ${socket.id})`);
        
        // Remove this socket from the user's socket set
        if (roomUsers.has(roomId) && roomUsers.get(roomId).has(username)) {
          const userSocketsSet = roomUsers.get(roomId).get(username);
          userSocketsSet.delete(socket.id);
          
          // If user has no more sockets, remove them from room
          if (userSocketsSet.size === 0) {
            roomUsers.get(roomId).delete(username);
            
            // Get updated participants list
            const participants = Array.from(roomUsers.get(roomId).keys());
            
            console.log(`${username} fully left room ${roomId}, participants:`, participants);
            
            // Notify room that user left with updated participants
            io.to(roomId).emit('user-left', {
              username,
              message: `${username} has left the room`,
              userId: socket.id,
              time: new Date(),
              participants
            });
            
            // Also send updated participants to all clients
            io.to(roomId).emit('room_data', { participants });
          }
        }
        
        // Clean up socket mapping
        socketMap.delete(socket.id);
      } else {
        console.log(`User disconnected: ${socket.id} (no username/room data)`);
      }
    });
    
    // Handle user leaving room
    socket.on('leave-room', ({ roomId, username }) => {
      console.log(`${username} leaving room: ${roomId} (socket ${socket.id})`);
      socket.leave(roomId);
      
      // Remove this socket from the user's socket set
      if (roomUsers.has(roomId) && roomUsers.get(roomId).has(username)) {
        const userSocketsSet = roomUsers.get(roomId).get(username);
        userSocketsSet.delete(socket.id);
        
        // If user has no more sockets, remove them from room
        if (userSocketsSet.size === 0) {
          roomUsers.get(roomId).delete(username);
          
          // Get updated participants list
          const participants = Array.from(roomUsers.get(roomId).keys());
          
          console.log(`${username} fully left room ${roomId}, participants:`, participants);
          
          // Notify room that user left with updated participants
          io.to(roomId).emit('user-left', {
            username,
            message: `${username} has left the room`,
            userId: socket.id,
            time: new Date(),
            participants
          });
          
          // Also send updated participants to all clients
          io.to(roomId).emit('room_data', { participants });
        }
      }
      
      // Clean up socket mapping
      socketMap.delete(socket.id);
      socket.data.roomId = null;
      socket.data.username = null;
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

