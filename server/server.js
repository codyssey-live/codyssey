import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './socket/socketService.js';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

// Load environment variables
dotenv.config({ path: path.resolve('..', '.env') });

const app = express();

// Create HTTP server with Express
const httpServer = createServer(app);
// Initialize socket.io with the HTTP server
const io = initSocket(httpServer);

// 1. Parse incoming JSON first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Add cookie-parser
app.use(cookieParser());

// 3. Then setup CORS with credentials support
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// 4. Healthcheck route (before DB connection)
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static files
app.use('/uploads', express.static(path.join('..', '/uploads')));

// Connect to MongoDB
connectDB();

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);

// Socket.IO connection handling
const connectedUsers = new Map(); // Store connected users with their socket IDs
const roomUsers = new Map(); // Store room participants

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    
    // Store the user info
    connectedUsers.set(socket.id, { username, roomId });
    
    // Add user to room participants list
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId).add(username);
    
    // Get all participants in the room
    const participants = Array.from(roomUsers.get(roomId));
    
    // Broadcast system message that user joined
    socket.to(roomId).emit('user_joined', { username, participants });
    
    // Send participants list to the new user
    socket.emit('room_data', { participants });
    
    console.log(`${username} joined room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    const { roomId } = messageData;
    console.log(`Message in room ${roomId}: ${messageData.text}`);
    
    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit('receive_message', messageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Get user info before removing from the map
    const userInfo = connectedUsers.get(socket.id);
    
    if (userInfo) {
      const { username, roomId } = userInfo;
      console.log(`User disconnected: ${username} from room ${roomId}`);
      
      // Remove user from the room participants
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(username);
        
        // Get updated participants list
        const participants = Array.from(roomUsers.get(roomId));
        
        // Notify others that user has left
        socket.to(roomId).emit('user_left', { username, participants });
      }
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
    }
  });

  // Handle user leaving room explicitly
  socket.on('leave_room', ({ roomId, username }) => {
    socket.leave(roomId);
    
    // Update room participants
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId).delete(username);
      
      // Get updated participants list
      const participants = Array.from(roomUsers.get(roomId));
      
      // Broadcast that user left
      socket.to(roomId).emit('user_left', { username, participants });
      
      console.log(`${username} left room: ${roomId}`);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8080;

// Update this to listen on the HTTP server, not the Express app
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
