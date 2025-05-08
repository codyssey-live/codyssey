import express from 'express';
import { createRoom, validateRoom, endRoom, cleanupOldRooms } from '../controllers/roomController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new room (requires authentication)
router.post('/create', protect, createRoom);

// Validate if a room exists and is active (public)
router.get('/validate/:roomId', validateRoom);

// End a room (public - anyone can end)
router.post('/end/:roomId', endRoom);

// Cleanup old rooms (admin only)
router.post('/cleanup', protect, adminOnly, cleanupOldRooms);

export default router;
