import User from '../models/User.js';
import Education from '../models/Education.js';
import WorkExperience from '../models/WorkExperience.js';
import bcrypt from 'bcryptjs';
import { deleteImage } from '../config/cloudinary.js';

// @desc    Change user password
// @route   PUT /api/users/:id/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    // Check if user is updating their own password
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user\'s password'
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    // Check if user is deleting their own account
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this account'
      });
    }
    
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }
    
    // Delete any profile picture from Cloudinary
    if (user.profilePicture && user.profilePicture.includes('cloudinary')) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicIdMatch = user.profilePicture.match(/\/([^/]+)\.[^.]+$/);
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = `leetroom/profile-pictures/${publicIdMatch[1]}`;
          await deleteImage(publicId);
          console.log('Deleted profile picture from Cloudinary');
        }
      } catch (err) {
        console.error('Error deleting profile picture from Cloudinary:', err);
        // Continue with account deletion even if image deletion fails
      }
    }
    
    // Delete related data - education and work experience
    await Education.deleteMany({ user: req.params.id });
    await WorkExperience.deleteMany({ user: req.params.id });
    
    // Delete the user account
    await User.findByIdAndDelete(req.params.id);
    
    // Clear authentication cookie
    res.cookie('token', '', { 
      httpOnly: true,
      expires: new Date(0) // Expires immediately
    });
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Place to add other user-related controllers like:
// getUserProfile, updateUserProfile, uploadProfilePicture, etc.
