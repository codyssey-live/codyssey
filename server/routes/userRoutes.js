import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Only select needed fields and exclude password
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean(); // Using lean for better performance when we don't need mongoose document methods
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return only what's needed for the profile page
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        socials: user.socials || { github: '', linkedin: '' },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (only authenticated user can update their own profile)
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    const { name, bio, socials } = req.body;
    
    // Find user and update
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    
    // Update social links if provided
    if (socials) {
      // Initialize socials object if it doesn't exist
      if (!user.socials) user.socials = {};
      
      // Update individual social links if provided
      user.socials.github = socials.github !== undefined ? socials.github : user.socials.github || '';
      user.socials.linkedin = socials.linkedin !== undefined ? socials.linkedin : user.socials.linkedin || '';
    }
    
    // Save the updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        socials: user.socials || { github: '', linkedin: '' },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Upload profile picture
// @route   POST /api/users/:id/profile-picture
// @access  Private
router.post('/:id/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate URL for the uploaded file
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
    
    // Delete old profile picture if exists
    if (user.profilePicture && user.profilePicture.startsWith(`${req.protocol}://${req.get('host')}/uploads/`)) {
      try {
        const oldPath = user.profilePicture.replace(`${req.protocol}://${req.get('host')}/`, '');
        fs.unlinkSync(oldPath);
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
        // Continue even if old file deletion fails
      }
    }

    // Update user profile with new image URL
    user.profilePicture = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        profilePicture: imageUrl
      },
      message: 'Profile picture updated successfully'
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image',
      error: error.message
    });
  }
});

export default router;
