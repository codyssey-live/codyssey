import { io } from 'socket.io-client';

// Create a socket instance connected to your server
const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080', {
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // Prevent multiple connections from same client
  transports: ['websocket'],
  autoConnect: false // We'll connect manually when needed
});

// Connection event handlers - without logging
socket.on('connect', () => { /* Connected */ });
socket.on('connect_error', () => { /* Handle error silently */ });
socket.on('disconnect', () => { /* Handle disconnect silently */ });

export default socket;
