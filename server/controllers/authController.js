import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    // Return success response
    res.status(201).json({ 
      message: 'User created successfully',
      token, 
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

    res.status(200).json({ 
      message: 'Login successful!', 
      token,
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
