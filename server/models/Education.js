import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  school: {
    type: String,
    required: [true, 'School/University name is required'],
    trim: true
  },
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true
  },
  startYear: {
    type: String, // Using string to accommodate YYYY-MM format from HTML input
    required: [true, 'Start year is required']
  },
  endYear: {
    type: String,
    default: 'Present'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Education', educationSchema);
