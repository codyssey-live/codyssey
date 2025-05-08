import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';

// Generate a random 8-character room ID
const generateRoomId = () => {
  // Use first 8 characters of UUID v4 without hyphens
  return uuidv4().replace(/-/g, '').substring(0, 8);
};

// Create a new room and return roomId
export const createRoom = async (req, res) => {
  try {
    const inviterId = req.user._id;
    const roomId = generateRoomId(); 
    
    const room = new Room({
      roomId,
      inviterId,
      active: true
    });
    
    await room.save();
    
    return res.status(201).json({
      success: true,
      data: { roomId }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

// Validate if a room exists and is active
export const validateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if room exists and is active
    const room = await Room.findOne({ roomId, active: true });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or is no longer active'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        roomId: room.roomId,
        active: room.active
      }
    });
  } catch (error) {
    console.error('Error validating room:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error validating room'
    });
  }
};

// End a room (mark as inactive)
export const endRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find and update the room status
    const room = await Room.findOneAndUpdate(
      { roomId },
      { active: false, endedAt: new Date() },
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Room ended successfully',
      data: { roomId }
    });
  } catch (error) {
    console.error('Error ending room:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end room'
    });
  }
};
