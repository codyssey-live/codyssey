import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    default: null
  },
  videoTitle: {
    type: String,
    default: null
  },
  videoUrl: {
    type: String,
    default: null
  },
  videoTimestamp: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Note = mongoose.model('Note', NoteSchema);

export default Note;
