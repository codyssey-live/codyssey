import apiClient from './apiClient.js';

// Get all notes for the current user
export const fetchAllNotes = async () => {
  try {
    const response = await apiClient.get('/notes');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
   
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch notes'
    };
  }
};

// Create a new note
export const createNote = async (noteData) => {
  try {
    const response = await apiClient.post('/notes', noteData);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create note'
    };
  }
};

// Delete a note
export const deleteNote = async (noteId) => {
  try {
    await apiClient.delete(`/notes/${noteId}`);
    return {
      success: true
    };
  } catch (error) {

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete note'
    };
  }
};
