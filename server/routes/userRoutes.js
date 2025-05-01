import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Education from '../models/Education.js';
import WorkExperience from '../models/WorkExperience.js';
import { uploadImage, deleteImage } from '../config/cloudinary.js';
import { 
  changePassword,
  deleteAccount
} from '../controllers/userController.js';

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/temp';
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
    // Find user with populated education and work experience
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('education')
      .populate('workExperience');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Map the education and work experience to match frontend expectations
    const mappedEducation = user.education ? user.education.map(edu => ({
      id: edu._id, // Map _id to id for frontend
      _id: edu._id, // Keep _id as well
      school: edu.school,
      degree: edu.degree,
      startYear: edu.startYear,
      endYear: edu.endYear
    })) : [];

    const mappedWorkExperience = user.workExperience ? user.workExperience.map(exp => ({
      id: exp._id, // Map _id to id for frontend
      _id: exp._id, // Keep _id as well
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate
    })) : [];
    
    // Return data properly formatted for the frontend
    res.status(200).json({
      success: true,
      data: {
        id: user._id, // Add id for frontend consistency
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        socials: user.socials || { github: '', linkedin: '' },
        education: mappedEducation,
        workExperience: mappedWorkExperience,
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
        education: user.education || [],
        workExperience: user.workExperience || [],
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

    // Upload image to Cloudinary
    const result = await uploadImage(req.file.path, {
      public_id: `user_${user._id}_${Date.now()}`, // Custom public_id
    });

    // Delete the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    // If user already has a profile picture in Cloudinary, delete it
    if (user.profilePicture && user.profilePicture.includes('cloudinary')) {
      try {
        // Extract public_id from the existing Cloudinary URL
        const publicIdMatch = user.profilePicture.match(/\/([^/]+)\.[^.]+$/);
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = `leetroom/profile-pictures/${publicIdMatch[1]}`;
          await deleteImage(publicId);
          console.log('Deleted old profile picture from Cloudinary');
        }
      } catch (err) {
        console.error('Error deleting old profile picture from Cloudinary:', err);
        // Continue even if old file deletion fails
      }
    }

    // Update user profile with Cloudinary URL
    user.profilePicture = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        profilePicture: result.secure_url
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

// @desc    Add education entry
// @route   POST /api/users/:id/education
// @access  Private
router.post('/:id/education', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    const { school, degree, startYear, endYear } = req.body;
    
    // Find user to verify it exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create a new Education document using the model
    const newEducation = new Education({
      user: req.params.id,
      school,
      degree,
      startYear,
      endYear: endYear || 'Present'
    });
    
    // Save the education entry to the database
    await newEducation.save();
    
    // Return response formatted for frontend with both id and _id
    res.status(201).json({
      success: true,
      data: {
        id: newEducation._id, // Add id for frontend consistency
        _id: newEducation._id,
        school: newEducation.school,
        degree: newEducation.degree,
        startYear: newEducation.startYear,
        endYear: newEducation.endYear || 'Present'
      }
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete education entry
// @route   DELETE /api/users/:id/education/:eduId
// @access  Private
router.delete('/:id/education/:eduId', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    // Find user to verify it exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find and delete the education entry
    const deletedEducation = await Education.findOneAndDelete({
      _id: req.params.eduId,
      user: req.params.id
    });
    
    if (!deletedEducation) {
      return res.status(404).json({
        success: false,
        message: 'Education entry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Education entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Add work experience entry
// @route   POST /api/users/:id/work-experience
// @access  Private
router.post('/:id/work-experience', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    const { company, position, startDate, endDate } = req.body;
    
    // Find user to verify it exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create a new WorkExperience document using the model
    const newWorkExperience = new WorkExperience({
      user: req.params.id,
      company,
      position,
      startDate,
      endDate: endDate || 'Present'
    });
    
    // Save the work experience entry to the database
    await newWorkExperience.save();
    
    // Return response formatted for frontend with both id and _id
    res.status(201).json({
      success: true,
      data: {
        id: newWorkExperience._id, // Add id for frontend consistency
        _id: newWorkExperience._id,
        company: newWorkExperience.company,
        position: newWorkExperience.position,
        startDate: newWorkExperience.startDate,
        endDate: newWorkExperience.endDate || 'Present'
      }
    });
  } catch (error) {
    console.error('Error adding work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete work experience entry
// @route   DELETE /api/users/:id/work-experience/:workId
// @access  Private
router.delete('/:id/work-experience/:workId', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    // Find user to verify it exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find and delete the work experience entry
    const deletedWorkExperience = await WorkExperience.findOneAndDelete({
      _id: req.params.workId,
      user: req.params.id
    });
    
    if (!deletedWorkExperience) {
      return res.status(404).json({
        success: false,
        message: 'Work experience entry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Work experience entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Change user password
// @route   PUT /api/users/:id/change-password
// @access  Private
router.put('/:id/change-password', protect, changePassword);

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
router.delete('/:id', protect, deleteAccount);

export default router;
