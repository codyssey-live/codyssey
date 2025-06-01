import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  saveSyllabus,
  getSyllabusByUserId,
  updateStudyDay,
  deleteStudyDay,
  updateProblemStatus 
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

// Update problem status - This route should handle status updates
router.put('/problem/:dayId/:problemId/status', updateProblemStatus);

export default router;
