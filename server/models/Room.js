import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  inviterId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
});

// Add TTL index to automatically delete ended rooms after 7 days
roomSchema.index({ endedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days

export default mongoose.model('Room', roomSchema);
