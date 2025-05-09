import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Important for cookies to be sent with requests
  withCredentials: true
});

// Add request interceptor to include auth token in all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request details to console
    console.debug(`API Request [${config.method.toUpperCase()}] ${config.url}`, 
      config.data ? config.data : 'No request body');
    
    // Check cookie presence for debugging
    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasToken = cookies.some(c => c.startsWith('token='));
    console.debug(`Authentication token present in cookies: ${hasToken}`);
    
    // Handle undefined or missing userId in URL more aggressively
    if (config.url) {
      // Check for undefined in URL
      if (config.url.includes('undefined')) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          config.url = config.url.replace(/\/undefined\/|\/undefined$/, `/${userId}/`);
          console.warn(`Fixed undefined userId in URL, using ID from localStorage: ${userId}`);
        } else {
          console.error('URL contains undefined userId but no userId found in localStorage');
        }
      }

      // Also handle null values
      if (config.url.includes('null')) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          config.url = config.url.replace(/\/null\/|\/null$/, `/${userId}/`);
          console.warn(`Fixed null userId in URL, using ID from localStorage: ${userId}`);
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in debug mode
    console.debug(`API Response [${response.status}] from ${response.config.url}`, 
      response.data ? response.data : 'No response data');
    return response;
  },
  (error) => {
    // Properly handle and log API errors
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`API Error [${error.response.status}] from ${error.config?.url}:`, 
        error.response.data);
        
      // Handle authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        console.warn('Authentication error detected, you may need to login');
        // You could redirect to login here or dispatch an authentication error event
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API request made but no response received:', error.request);
    } else {
      // Error setting up the request
      console.error('API request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
