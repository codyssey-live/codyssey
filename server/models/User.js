import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  profilePicture: {
    type: String,
    default: 'https://example.com/default-profile-picture.png',
  },
  // Bio field
  bio: {
    type: String,
    trim: true,
    maxlength: [250, 'Bio cannot be more than 250 characters']
  },
  // Social links
  socials: {
    github: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    }
  },
  friendList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetCode: {
    type: String
  },
  resetCodeExpires: {
    type: Date
  },
  // Now we use references instead of embedding
  // These will be populated when needed
});

// Virtual properties to get education and work experience
userSchema.virtual('education', {
  ref: 'Education',
  localField: '_id',
  foreignField: 'user'
});

userSchema.virtual('workExperience', {
  ref: 'WorkExperience',
  localField: '_id', 
  foreignField: 'user'
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);