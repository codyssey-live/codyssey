import apiClient from './apiClient';

export const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    
    // Store user ID in localStorage as a backup
    if (response.data && (response.data.id || response.data._id)) {
      const userId = response.data.id || response.data._id;
      localStorage.setItem('userId', userId);
    
    }
    
    return response.data;
  } catch (error) {
   
    throw error;
  }
};

// Get user ID from localStorage as a fallback
export const getUserId = () => {
  const userId = localStorage.getItem('userId');
  return userId;
};

// Force save ID to localStorage
export const saveUserId = (userId) => {
  if (userId) {
    localStorage.setItem('userId', userId);
   
    return true;
  }
  return false;
};
