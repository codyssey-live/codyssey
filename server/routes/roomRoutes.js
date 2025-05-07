import express from 'express';
import { createRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Log the request when trying to create a room
router.post('/create', (req, res, next) => {
  console.log('Room creation request received. Checking authentication...');
  console.log('Cookies:', req.cookies);
  next();
}, protect, createRoom);

export default router;
