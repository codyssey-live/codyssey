import express from 'express';
import { signup, login, signout, getCurrentUser, forgotPassword, verifyResetCode, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/signout', signout); // Renamed from logout to signout
router.get('/me', protect, getCurrentUser);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
