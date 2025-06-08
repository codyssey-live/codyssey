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
import syllabusRoutes from './routes/syllabusRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Load environment variables
// For Windows - use directly configured path for .env file
const envPath = path.resolve('.', '.env');
dotenv.config({ path: envPath });


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
  origin: ['https://codyssey.live', 'http://localhost:5173', 'https://codyssey-lovat.vercel.app'],
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
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/contact', contactRoutes);

// Socket.IO connection handling
const connectedUsers = new Map(); // Store connected users with their socket IDs
const roomUsers = new Map(); // Store room participants with connection count

io.on('connection', (socket) => {
  
  // Store the last activity timestamps to prevent duplicate notifications
  const lastActivity = new Map();

  // Handle joining a room
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    
    // Store the user info
    connectedUsers.set(socket.id, { username, roomId });
    
    // Initialize room if needed
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    
    const roomUserMap = roomUsers.get(roomId);
    
    // Check if this is a new join or a refresh
    const isNewUser = !roomUserMap.has(username);
    
    // Update or initialize the user's connection count
    roomUserMap.set(username, (roomUserMap.get(username) || 0) + 1);
    
    // Get all participants in the room
    const participants = Array.from(roomUserMap.keys());
    
    // Remove all join notifications - only update the participant list without messages
    
    // Always send the updated participant list to everyone without join messages
    io.to(roomId).emit('room_data', { participants });
  });  // Handle sending messages
  socket.on('send_message', (messageData) => {
    const { roomId, message, source } = messageData;
    
    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit('receive_message', {
      ...messageData,
      time: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Get user info before removing from the map
    const userInfo = connectedUsers.get(socket.id);
    
    if (userInfo) {
      const { username, roomId } = userInfo;
      
      // Check if user has other connections to this room
      if (roomUsers.has(roomId)) {
        const roomUserMap = roomUsers.get(roomId);
        
        // Decrease connection count
        if (roomUserMap.has(username)) {
          const connectionsCount = roomUserMap.get(username) - 1;
          
          if (connectionsCount <= 0) {
            // User has fully left the room
            roomUserMap.delete(username);
            
            // Get updated participants list
            const participants = Array.from(roomUserMap.keys());
            
            
            
            // Update participants list for everyone without leave messages
            io.to(roomId).emit('room_data', { participants });
          } else {
            // User still has other connections, just update the count
            roomUserMap.set(username, connectionsCount);
          }
        }
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
      const roomUserMap = roomUsers.get(roomId);
      
      if (roomUserMap.has(username)) {
        const connectionsCount = roomUserMap.get(username) - 1;
        
        if (connectionsCount <= 0) {
          // User has fully left the room
          roomUserMap.delete(username);
          
          // Get updated participants list
          const participants = Array.from(roomUserMap.keys());
          
          // Update participants list for everyone without leave messages
          io.to(roomId).emit('room_data', { participants });
        } else {
          // User still has other connections, just update the count
          roomUserMap.set(username, connectionsCount);
        }
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8080;

// Update this to listen on the HTTP server, not the Express app
httpServer.listen(PORT,  () => {
});
