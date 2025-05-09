import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  saveSyllabus,
  getSyllabusByUserId,
  updateStudyDay,
  deleteStudyDay
} from '../controllers/syllabusController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Save complete syllabus
router.post('/', saveSyllabus);

// Get syllabus by user ID
router.get('/:userId', getSyllabusByUserId);

// Update specific study day
router.put('/day/:dayId', updateStudyDay);

// Delete specific study day
router.delete('/day/:dayId', deleteStudyDay);

export default router;
