import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';

// Create a new room and return roomId
export const createRoom = async (req, res) => {
  try {
    const inviterId = req.user._id;
    const roomId = uuidv4(); // Generate a unique room ID
    
    const room = new Room({
      roomId,
      inviterId
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
