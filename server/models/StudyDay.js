import mongoose from 'mongoose';

// Problem schema (embedded)
const problemSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'],
    required: true 
  },
  platform: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['unsolved', 'solved', 'solveLater'],
    default: 'unsolved'
  }
});

// Video schema (embedded)
const videoSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['single', 'playlist', 'video'], // Add 'video' to the allowed values
    default: 'single',
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  }
});

// Study Day schema
const studyDaySchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  description: { 
    type: String 
  },
  problems: [problemSchema],
  videos: [videoSchema],
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

const StudyDay = mongoose.model('StudyDay', studyDaySchema);

export default StudyDay;
