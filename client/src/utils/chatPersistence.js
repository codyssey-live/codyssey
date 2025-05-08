// A utility for persisting chat messages across page navigations

// Key format: chat-messages-{roomId}
const getStorageKey = (roomId) => `chat-messages-${roomId}`;

// Save messages to localStorage
export const saveMessages = (roomId, messages) => {
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving chat messages to localStorage:', error);
    return false;
  }
};

// Load messages from localStorage
export const loadMessages = (roomId) => {
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
    console.error('Error loading chat messages from localStorage:', error);
    return null;
  }
};

// Clear messages from localStorage
export const clearMessages = (roomId) => {
  try {
    localStorage.removeItem(getStorageKey(roomId));
    return true;
  } catch (error) {
    console.error('Error clearing chat messages from localStorage:', error);
    return false;
  }
};
