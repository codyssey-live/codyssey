import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createRoom, 
  validateRoom, 
  endRoom, 
  cleanupOldRooms 
} from '../controllers/roomController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Create a new room 
router.post('/create', createRoom);

// Validate if a room exists and is active
router.get('/validate/:roomId', validateRoom);

// End a room
router.delete('/:roomId', endRoom);

// Cleanup old rooms - admin only
router.delete('/cleanup/old', cleanupOldRooms);

export default router;
