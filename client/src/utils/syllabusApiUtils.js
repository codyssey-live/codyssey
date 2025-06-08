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
        // Ensure dateAdded is present for all problems
        return {
          ...problemWithoutId,
          dateAdded: problemWithoutId.dateAdded || new Date()
        };
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
    

    
    const response = await apiClient.post('/syllabus', {
      studyDays: transformedData
    });
    
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
 
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to save syllabus'
    };
  }
};

// Fetch syllabus for specified user
export const fetchSyllabus = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch syllabus');
    }
    
 
    const response = await apiClient.get(`/syllabus/${userId}`);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {

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

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update study day'
    };
  }
};

// Delete a study day
export const deleteStudyDay = async (dayId) => {
  try {

    const response = await apiClient.delete(`/syllabus/day/${dayId}`);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete study day'
    };
  }
};

// Update problem status
export const updateProblemStatus = async (dayId, problemId, status) => {
  try {
    
    // Fix: Use correct API path and apiClient for consistent credentials and basePath handling
    const response = await apiClient.put(`/syllabus/problem/${dayId}/${problemId}/status`, { status });
    

    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error updating problem status');
    }
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Status updated successfully'
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Error updating problem status'
    };
  }
};

// Fetch a single study day by ID
export const fetchStudyDay = async (dayId) => {
  try {
    if (!dayId) {
      throw new Error('Day ID is required to fetch study day');
    }
    

    const response = await apiClient.get(`/syllabus/day/${dayId}`);
    
    // Validate the data structure
    if (!response.data.success || !response.data.data) {
      throw new Error('Invalid API response structure');
    }
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch study day'
    };
  }
};

// Fetch all problems for a specific user
export const fetchUserSyllabusProblems = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch user problems');
    }
    
    const response = await apiClient.get(`/syllabus/user/${userId}/problems`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch user problems'
    };
  }
};
