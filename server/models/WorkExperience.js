import mongoose from 'mongoose';

const workExperienceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  startDate: {
    type: String, // Using string to accommodate YYYY-MM format from HTML input
    required: [true, 'Start date is required']
  },
  endDate: {
    type: String,
    default: 'Present'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('WorkExperience', workExperienceSchema);
