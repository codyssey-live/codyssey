import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Resend } from 'resend';
import crypto from 'crypto';

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

// Remove direct Resend initialization
// Instead, implement a getter function with caching
let resendClient = null;

// Function to get or create the Resend client
const getResendClient = () => {
  if (!resendClient) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Resend API key is missing. Check your environment variables.');
    }
    resendClient = new Resend(resendApiKey);
    console.log('Resend client initialized successfully');
  }
  return resendClient;
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  
  // Enhanced validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email and password' });
  }
  // Enhanced password validation - alphanumeric with special character
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters long and include letters, numbers, and at least one special character' 
    });
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
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Send token in cookie
    res.cookie('token', token, cookieOptions);

    res.status(200).json({ 
      message: 'Login successful!', 
      token: token, // Also include token in response body for client-side auth
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
  
  res.status(200).json({ 
    message: 'Signed out successfully',
    clearLocalStorage: true // Signal to client to clear localStorage tokens
  });
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

// Route 1: Request password reset
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user doesn't exist, return 404
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    // Generate a 6-digit OTP
    const resetCode = generateOTP();
    
    // Set expiration time (15 minutes from now)
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Save the code and expiry to the user's document
    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;    await user.save();

    // Send the OTP to the user's email using Resend
    try {
      // Use lazy-loaded Resend client
      const resend = getResendClient();
      
      await resend.emails.send({
        from: 'Codyssey <noreply@codyssey.live>',
        to: email,
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
            <!-- Header with gradient -->
            <div style="background: linear-gradient(135deg,rgb(139, 219, 246) 0%, #94c3d2 100%); padding: 25px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Codyssey</h1>
            </div>
            
            <!-- Content area -->
            <div style="background-color: white; padding: 30px 25px;">
              <h2 style="color: #1F2937; text-align: center; margin-top: 0; margin-bottom: 25px; font-size: 22px;">Password Reset</h2>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 24px;">Hello ${user.name},</p>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 24px;">We received a request to reset your password. Use the verification code below to complete the process:</p>
              
              <!-- Verification code box -->
              <div style="background: linear-gradient(to right, #F9FAFB, #F3F4F6); border: 1px solid #E5E7EB; padding: 16px; border-radius: 8px; text-align: center; margin: 25px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #94c3d2;">
                  ${resetCode}
                </div>
              </div>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin-bottom: 25px;">This code will expire in <span style="font-weight: 600; color: #1F2937;">15 minutes</span>.</p>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 24px;">If you didn't request this reset, please ignore this email or contact our support team.</p>
              
              <div style="margin: 35px 0 25px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
                <p style="color: #4B5563; font-size: 16px; margin-bottom: 5px; font-weight: 600;">Thanks,</p>
                <p style="color: #4B5563; font-size: 16px; margin-top: 0;">The Codyssey Team</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #F9FAFB; padding: 15px; text-align: center;">
              <p style="font-size: 13px; color: #6B7280; margin: 0;">
                &copy; ${new Date().getFullYear()} Codyssey. All rights reserved.
              </p>
            </div>
          </div>
        `
      });

      // Return success response (without exposing the code)
      res.status(200).json({
        message: 'Reset code sent to your email'
      });
    } catch (err) {
      user.resetCode = undefined;
      user.resetCodeExpires = undefined;
      await user.save();
      
      console.error('Email sending error:', err);
      return res.status(500).json({ message: 'Email could not be sent', error: err.message });
    }
    
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ 
      message: 'An error occurred while processing your request'
    });
  }
};

// Route 2: Verify reset code
export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    // Find the user
    const user = await User.findOne({ 
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() } // Check if code hasn't expired
    });

    // If no user found with matching code or code expired
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Return success
    res.status(200).json({
      message: 'Code verified successfully'
    });
    
  } catch (err) {
    console.error('Code verification error:', err);
    res.status(500).json({ 
      message: 'An error occurred while verifying code'
    });
  }
};

// Route 3: Reset password after verification
export const resetPassword = async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;

  // Validate required fields
  if (!email || !code || !newPassword || !confirmPassword) {
    return res.status(400).json({ 
      message: 'Email, code, new password, and confirm password are required' 
    });
  }

  // Check if passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  // Enhanced password validation - alphanumeric with special character
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters long and include letters, numbers, and at least one special character' 
    });
  }

  try {
    // Find user with matching code that hasn't expired
    const user = await User.findOne({ 
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() }
    });

    // If no valid reset code found
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    
    await user.save();

    // Return success
    res.status(200).json({
      message: 'Password reset successful'
    });
    
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ 
      message: 'An error occurred while resetting password'
    });
  }
};

// Update sendVerificationEmail function to use the lazy-loaded client
const sendVerificationEmail = async (user) => {
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await user.save();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    const message = `
      <h1>Verify Your Email Address</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
    `;
    
    // Use lazy-loaded Resend client
    const resend = getResendClient();
    
    await resend.emails.send({
      from: 'Codyssey <noreply@codyssey.live>',
      to: [user.email],
      subject: 'Email Verification',
      html: message
    });
    
    return true;
  } catch (error) {
    console.error('Verification email error:', error);
    return false;
  }
};

export { 
  sendVerificationEmail 
};
