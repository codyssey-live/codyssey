import { io } from 'socket.io-client';

// Create a socket instance connected to your server
// Make sure this port matches your server's actual port
const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:8080', {
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true // Make sure auto-connect is enabled
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

export default socket;
