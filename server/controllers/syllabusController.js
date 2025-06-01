import mongoose from 'mongoose';
import Syllabus from '../models/Syllabus.js';
import StudyDay from '../models/StudyDay.js';

// @desc    Save a complete syllabus
// @route   POST /syllabus
// @access  Private
export const saveSyllabus = async (req, res) => {
  try {
    // Enhanced debugging
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User object:', JSON.stringify(req.user, null, 2));
    
    const { studyDays } = req.body;
    
    // Get user ID from req.user - handle any possible format
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      console.error('User ID not found in request');
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }
    
    console.log('Processing syllabus save for user:', userId);
    console.log('Study days count:', studyDays?.length || 0);

    if (!studyDays || !Array.isArray(studyDays)) {
      console.error('Invalid study days data:', studyDays);
      return res.status(400).json({
        success: false,
        message: 'Study days data is required and must be an array'
      });
    }

    // Start a transaction for data integrity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('Looking for existing syllabus for user:', userId);
      
      // Find existing syllabus or create new one
      let syllabus = await Syllabus.findOne({ userId }).session(session);
      
      if (!syllabus) {
        console.log('No existing syllabus found, creating new one');
        syllabus = new Syllabus({ 
          userId,
          studyDays: [] 
        });
      } else {
        console.log('Found existing syllabus:', syllabus._id);
      }
      
      // Process each study day
      const savedDayIds = [];
      
      console.log('Processing study days...');
      for (const dayData of studyDays) {
        console.log('Processing day:', dayData.title, 'with ID:', dayData.id || dayData._id || 'new');
        
        // Map frontend field names to backend model field names
        const mappedDayData = {
          ...dayData,
          // Map resources array to videos if it exists
          videos: dayData.resources || dayData.videos || [],
          // Ensure userId is set
          userId
        };
        
        // Handle existing study day or create new one
        if (dayData._id && mongoose.Types.ObjectId.isValid(dayData._id)) {
          // If _id is provided and it's a valid ObjectId, try to update
          console.log('Updating existing day with valid ObjectId:', dayData._id);
          
          const existingDay = await StudyDay.findById(dayData._id).session(session);
          
          if (existingDay) {
            // Handle update for existing document with valid ObjectId
            if (existingDay.userId.toString() === userId.toString()) {
              existingDay.title = mappedDayData.title;
              existingDay.date = mappedDayData.date;
              existingDay.description = mappedDayData.description;
              existingDay.problems = mappedDayData.problems || [];
              existingDay.videos = mappedDayData.videos || [];
              
              const savedDay = await existingDay.save({ session });
              savedDayIds.push(savedDay._id);
            }
          } else {
            // Create new if not found
            const newDay = new StudyDay({
              ...mappedDayData,
              _id: new mongoose.Types.ObjectId()
            });
            
            const savedDay = await newDay.save({ session });
            savedDayIds.push(savedDay._id);
          }
        } else {
          // Create new day for non-ObjectId values or when no ID provided
          console.log('Creating new study day (invalid or no MongoDB ID)');
          
          // Ensure we remove any client-side ID and let MongoDB create a proper ObjectId
          const { id, _id, ...dayDataWithoutId } = mappedDayData;
          
          const newDay = new StudyDay({
            ...dayDataWithoutId
          });
          
          const savedDay = await newDay.save({ session });
          console.log('Day saved with new MongoDB ID:', savedDay._id);
          savedDayIds.push(savedDay._id);
        }
      }
      
      // Update syllabus with the current study days
      syllabus.studyDays = savedDayIds;
      syllabus.lastUpdated = new Date();
      
      const savedSyllabus = await syllabus.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      
      // Fetch full syllabus with populated study days
      const populatedSyllabus = await Syllabus.findById(savedSyllabus._id)
        .populate('studyDays');
      
      res.status(200).json({
        success: true,
        data: populatedSyllabus
      });
    } catch (error) {
      // Abort transaction on error
      console.error('Error during transaction:', error);
      await session.abortTransaction();
      throw error;
    } finally {
      console.log('Ending session');
      session.endSession();
    }
  } catch (error) {
    console.error('Error saving syllabus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving syllabus',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
    });
  }
};

// @desc    Get syllabus by user ID
// @route   GET /syllabus/:userId
// @access  Private
export const getSyllabusByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Fetching syllabus for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Ensure userId is treated as ObjectId if valid
    let userIdToQuery = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdToQuery = new mongoose.Types.ObjectId(userId);
    }
    
    // Find syllabus for the requested user
    const syllabus = await Syllabus.findOne({ userId: userIdToQuery })
      .populate({
        path: 'studyDays',
        populate: [
          { path: 'problems' },
          { path: 'videos' }
        ]
      });
    
    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: `No syllabus found for user ${userId}`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: syllabus
    });
    
  } catch (error) {
    console.error('Error fetching syllabus by userId:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching syllabus',
      error: error.message
    });
  }
};

// @desc    Update a specific study day
// @route   PUT /syllabus/day/:dayId
// @access  Private
export const updateStudyDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user._id || req.user.id;
    const updates = req.body;
    
    // Find the study day and verify ownership
    const studyDay = await StudyDay.findById(dayId);
    
    if (!studyDay) {
      return res.status(404).json({
        success: false,
        message: 'Study day not found'
      });
    }
    
    // Verify ownership
    if (studyDay.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this study day'
      });
    }
    
    // Apply updates - Map frontend field names to backend model field names
    const allowedUpdates = ['title', 'date', 'description', 'problems', 'videos', 'resources'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'resources') {
          // Map resources to videos field in the model
          studyDay.videos = updates.resources;
        } else {
          studyDay[field] = updates[field];
        }
      }
    });
    
    await studyDay.save();
    
    // Update lastUpdated on the syllabus
    await Syllabus.findOneAndUpdate(
      { userId },
      { lastUpdated: new Date() }
    );
    
    res.status(200).json({
      success: true,
      data: studyDay
    });
  } catch (error) {
    console.error('Error updating study day:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating study day',
      error: error.message
    });
  }
};

// @desc    Delete a specific study day
// @route   DELETE /syllabus/day/:dayId
// @access  Private
export const deleteStudyDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user._id || req.user.id;
    
    // Find the study day and verify ownership
    const studyDay = await StudyDay.findById(dayId);
    
    if (!studyDay) {
      return res.status(404).json({
        success: false,
        message: 'Study day not found'
      });
    }
    
    if (studyDay.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this study day'
      });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Remove the study day reference from syllabus
      await Syllabus.findOneAndUpdate(
        { userId },
        { 
          $pull: { studyDays: dayId },
          lastUpdated: new Date() 
        },
        { session }
      );
      
      // Delete the study day
      await StudyDay.findByIdAndDelete(dayId).session(session);
      
      await session.commitTransaction();
      
      res.status(200).json({
        success: true,
        message: 'Study day deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error deleting study day:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting study day',
      error: error.message
    });
  }
};

// @desc    Update problem status
// @route   PUT /syllabus/problem/:dayId/:problemId/status
// @access  Private
export const updateProblemStatus = async (req, res) => {
  try {
    const { dayId, problemId } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    console.log(`Updating problem ${problemId} status to ${status} in day ${dayId} for user ${userId}`);

    if (!status || !['solved', 'unsolved', 'solveLater'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: solved, unsolved, solveLater'
      });
    }

    // Find the study day
    const studyDay = await StudyDay.findById(dayId);
    
    if (!studyDay) {
      return res.status(404).json({
        success: false,
        message: 'Study day not found'
      });
    }
    
    // Temporarily disable owner check for debugging
    // if (studyDay.userId.toString() !== userId.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this study day'
    //   });
    // }
    
    // Find the problem in the study day
    const problem = studyDay.problems.id(problemId);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found in this study day'
      });
    }
    
    console.log(`Found problem to update: ${problem.title}, current status: ${problem.status}`);
    
    // Update the status
    problem.status = status;
    
    // Save the updated study day
    await studyDay.save();
    
    console.log(`Successfully updated problem status to ${status}`);
    
    return res.status(200).json({
      success: true,
      message: 'Problem status updated successfully',
      data: problem
    });
  } catch (error) {
    console.error('Error updating problem status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating problem status',
      error: error.message
    });
  }
};

// @desc    Get a specific study day by ID
// @route   GET /syllabus/day/:dayId
// @access  Private
export const getStudyDayById = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(dayId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study day ID format'
      });
    }

    // Find study day
    const studyDay = await StudyDay.findById(dayId);

    if (!studyDay) {
      return res.status(404).json({
        success: false,
        message: 'Study day not found'
      });
    }

    // Check if user has access to this study day
    if (studyDay.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this study day'
      });
    }

    res.status(200).json({
      success: true,
      data: studyDay
    });
  } catch (error) {
    console.error('Error fetching study day by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study day',
      error: error.message
    });
  }
};
