import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One syllabus per user
  },
  studyDays: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyDay'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add a pre-save hook to ensure userId is always an ObjectId
syllabusSchema.pre('save', function(next) {
  // If userId is a string, convert it to ObjectId
  if (this.userId && typeof this.userId === 'string') {
    try {
      this.userId = new mongoose.Types.ObjectId(this.userId);
    } catch (err) {
      console.error('Error converting userId to ObjectId:', err);
    }
  }
  next();
});

// Custom query middleware to handle string IDs in queries
syllabusSchema.pre('findOne', function(next) {
  if (this._conditions.userId && typeof this._conditions.userId === 'string') {
    try {
      this._conditions.userId = new mongoose.Types.ObjectId(this._conditions.userId);
    } catch (err) {
      console.error('Error converting query userId to ObjectId:', err);
    }
  }
  next();
});

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

export default Syllabus;
