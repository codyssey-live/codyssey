import express from 'express';
import { createRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected route - only logged-in users can create rooms
router.post('/create', protect, createRoom);

export default router;
