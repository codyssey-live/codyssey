// A utility for persisting collab room chat messages across page navigations
// This is separate from the regular and lecture chat persistence to avoid sharing messages

// Key format: collab-chat-messages-{roomId}
const getStorageKey = (roomId) => `collab-chat-messages-${roomId}`;

// Save messages to localStorage
export const saveCollabMessages = (roomId, messages) => {
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving collab chat messages to localStorage:', error);
    return false;
  }
};

// Load messages from localStorage
export const loadCollabMessages = (roomId) => {
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
    console.error('Error loading collab chat messages from localStorage:', error);
    return null;
  }
};

// Clear messages from localStorage
export const clearCollabMessages = (roomId) => {
  try {
    localStorage.removeItem(getStorageKey(roomId));
    return true;
  } catch (error) {
    console.error('Error clearing collab chat messages from localStorage:', error);
    return false;
  }
};
