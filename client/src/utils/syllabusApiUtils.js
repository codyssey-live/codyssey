import apiClient from './apiClient.js';

// Save complete syllabus
export const saveSyllabus = async (syllabusData) => {
  try {
    // Transform data for API compatibility - handle ID formats
    const transformedData = syllabusData.map(day => {
      // Preserve MongoDB _id if exists, otherwise omit client-side id
      const { id, ...dayWithoutNumericId } = day;
      
      // Transform embedded problems to ensure they have proper format
      const problems = day.problems?.map(problem => {
        const { id: problemId, ...problemWithoutId } = problem;
        return problemWithoutId;
      }) || [];
      
      // Transform resources to videos with proper format for the backend
      // Ensure the type is one of the allowed values: 'single', 'playlist', or 'video'
      const videos = day.resources?.map(resource => {
        const { id: resourceId, ...resourceWithoutId } = resource;
        
        // Map video type to a valid enum value
        let videoType = resource.type || 'single';
        // If type is not one of the allowed values, default to 'single'
        if (!['single', 'playlist', 'video'].includes(videoType)) {
          videoType = 'single';
        }
        
        return {
          ...resourceWithoutId,
          type: videoType
        };
      }) || [];
      
      return {
        ...dayWithoutNumericId,
        _id: day._id, // Keep MongoDB _id if available
        problems,
        videos
      };
    });
    
    console.log('Sending syllabus data to API:', transformedData);
    
    const response = await apiClient.post('/syllabus', {
      studyDays: transformedData
    });
    
    console.log('API response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error saving syllabus:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to save syllabus'
    };
  }
};

// Fetch syllabus for current user
export const fetchSyllabus = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch syllabus');
    }
    
    console.log('Fetching syllabus for user:', userId);
    const response = await apiClient.get(`/syllabus/${userId}`);
    console.log('Syllabus API response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching syllabus:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch syllabus'
    };
  }
};

// Update a specific study day
export const updateStudyDay = async (dayId, dayData) => {
  try {
    const response = await apiClient.put(`/syllabus/day/${dayId}`, dayData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating study day:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update study day'
    };
  }
};

// Delete a study day
export const deleteStudyDay = async (dayId) => {
  try {
    console.log('Deleting study day with ID:', dayId);
    const response = await apiClient.delete(`/syllabus/day/${dayId}`);
    console.log('Delete API response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting study day:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete study day'
    };
  }
};
