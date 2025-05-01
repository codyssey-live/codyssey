import apiClient from './apiClient';
import { getUserId } from './authUtils';

// Helper function for consistent response handling
const handleResponse = (response, entityName) => {
  console.log(`${entityName} API response:`, response);
  
  // Check if response has the expected structure
  if (response.data) {
    if (response.data.success && response.data.data) {
      // Format with both id and _id for consistency
      const responseData = response.data.data;
      return {
        data: {
          ...responseData,
          id: responseData._id || responseData.id,
          _id: responseData._id || responseData.id
        }
      };
    } else if (response.data.success) {
      console.warn(`${entityName} response missing data property:`, response.data);
      return { data: response.data };
    } else {
      // Success is false but we still have data
      return { data: response.data };
    }
  }
  
  // Fallback for unexpected response format
  console.warn(`Unexpected ${entityName} response format:`, response);
  return response;
};

// Helper function for error handling
const handleError = (error, entityName) => {
  console.error(`Error in ${entityName}:`, error);
  const errorDetail = error.response?.data?.message || error.message || `${entityName} operation failed`;
  console.error('Error details:', errorDetail);
  throw new Error(`${entityName} failed: ${errorDetail}`);
};

// Helper function to validate user ID with fallback to localStorage
const validateUserId = (userId) => {
  // If userId is provided, use it
  if (userId) {
    return userId;
  }
  
  // Otherwise try to get from localStorage
  const localStorageId = getUserId();
  if (localStorageId) {
    console.log('Using userId from localStorage:', localStorageId);
    return localStorageId;
  }
  
  // If still no ID, throw an error
  console.error('Missing user ID in API call and not found in localStorage');
  throw new Error('User ID is required. Please reload the page or login again.');
};

// Update user personal information
export const updateUserProfile = async (userId, profileData) => {
  try {
    userId = validateUserId(userId);
    console.log('Updating profile with data for user ID:', userId, profileData);
    const response = await apiClient.put(`/users/${userId}`, profileData);
    return handleResponse(response, 'Update profile');
  } catch (error) {
    return handleError(error, 'Profile update');
  }
};

// Upload profile picture
export const uploadProfilePicture = async (userId, formData) => {
  try {
    userId = validateUserId(userId);
    console.log('Uploading profile picture for user:', userId);
    const response = await apiClient.post(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return handleResponse(response, 'Profile picture');
  } catch (error) {
    return handleError(error, 'Profile picture upload');
  }
};

// Add education entry
export const addEducation = async (userId, educationData) => {
  try {
    userId = validateUserId(userId);
    console.log('Adding education with data for user ID:', userId, educationData);
    const response = await apiClient.post(`/users/${userId}/education`, educationData);
    return handleResponse(response, 'Education');
  } catch (error) {
    return handleError(error, 'Education');
  }
};

// Delete education entry
export const deleteEducation = async (userId, educationId) => {
  try {
    userId = validateUserId(userId);
    console.log(`Deleting education ${educationId} for user ${userId}`);
    const response = await apiClient.delete(`/users/${userId}/education/${educationId}`);
    return handleResponse(response, 'Education deletion');
  } catch (error) {
    return handleError(error, 'Education deletion');
  }
};

// Add work experience entry
export const addWorkExperience = async (userId, workData) => {
  try {
    userId = validateUserId(userId);
    console.log('Adding work experience with data for user ID:', userId, workData);
    const response = await apiClient.post(`/users/${userId}/work-experience`, workData);
    return handleResponse(response, 'Work experience');
  } catch (error) {
    return handleError(error, 'Work experience');
  }
};

// Delete work experience entry
export const deleteWorkExperience = async (userId, workId) => {
  try {
    userId = validateUserId(userId);
    console.log(`Deleting work experience ${workId} for user ${userId}`);
    const response = await apiClient.delete(`/users/${userId}/work-experience/${workId}`);
    return handleResponse(response, 'Work experience deletion');
  } catch (error) {
    return handleError(error, 'Work experience deletion');
  }
};
