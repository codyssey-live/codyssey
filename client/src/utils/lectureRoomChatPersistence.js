// A utility for persisting lecture room chat messages across page navigations
// This is separate from the regular chat persistence to avoid sharing messages

// Key format: lecture-chat-messages-{roomId}
const getStorageKey = (roomId) => `lecture-chat-messages-${roomId}`;

// Save messages to localStorage
export const saveLectureMessages = (roomId, messages) => {
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving lecture chat messages to localStorage:', error);
    return false;
  }
};

// Load messages from localStorage
export const loadLectureMessages = (roomId) => {
  try {
    const storedMessages = localStorage.getItem(getStorageKey(roomId));
    if (storedMessages) {
      // Parse the messages and ensure all date strings are converted back to Date objects
      const messages = JSON.parse(storedMessages);
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return null;
  } catch (error) {
    console.error('Error loading lecture chat messages from localStorage:', error);
    return null;
  }
};

// Clear messages from localStorage
export const clearLectureMessages = (roomId) => {
  try {
    localStorage.removeItem(getStorageKey(roomId));
    return true;
  } catch (error) {
    console.error('Error clearing lecture chat messages from localStorage:', error);
    return false;
  }
};
