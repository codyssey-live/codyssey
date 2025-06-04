import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  
  // Enhanced validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email and password' });
  }

  // Explicit password length validation
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Only check for duplicate email since we don't require unique names
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: 'Email already in use. Please use another email address.' });
    }

    // Create password hash
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword 
    }).catch(err => {
      console.error('Database error during user creation:', err);
      
      // If there's a MongoDB duplicate key error
      if (err.code === 11000) {
        // Only email should trigger a duplicate key error
        if (err.keyPattern && err.keyPattern.email) {
          throw new Error('Email already exists. Please use another email address.');
        } else if (err.keyPattern && err.keyPattern.name) {
          // This means there's still a unique index on the name field in MongoDB
          throw new Error('There is a database configuration issue with user names. Please contact support.');
        } else {
          throw new Error(`Duplicate key error on field: ${Object.keys(err.keyPattern || {}).join(', ')}`);
        }
      }
      throw err;
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // We're removing this code - no cookie setting after signup
    // No automatic login after signup

    // Return success response (without token in body)
    res.status(201).json({ 
      message: 'User created successfully',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
    
  } catch (err) {
    res.status(500).json({ 
      message: `Registration failed: ${err.message || 'Server error'}` 
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Send token in cookie
    res.cookie('token', token, cookieOptions);

    res.status(200).json({ 
      message: 'Login successful!', 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const signout = async (req, res) => {
  res.cookie('token', '', { 
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    expires: new Date(0) // Expires immediately
  });
  
  res.status(200).json({ message: 'Signed out successfully' });
};

export const getCurrentUser = async (req, res) => {
  try {
    // Get the full user data with populated education and work experience
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('education')
      .populate('workExperience');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Map the education and work experience to match frontend expectations
    const mappedEducation = user.education ? user.education.map(edu => ({
      id: edu._id,
      _id: edu._id,
      school: edu.school,
      degree: edu.degree,
      startYear: edu.startYear,
      endYear: edu.endYear
    })) : [];

    const mappedWorkExperience = user.workExperience ? user.workExperience.map(exp => ({
      id: exp._id,
      _id: exp._id,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate
    })) : [];
    
    // Return user data (excluding password)
    res.status(200).json({
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture || '',
      bio: user.bio || '',
      socials: user.socials || { github: '', linkedin: '' },
      education: mappedEducation,
      workExperience: mappedWorkExperience
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
