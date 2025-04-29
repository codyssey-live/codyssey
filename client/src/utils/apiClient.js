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

// No need for Authorization header interceptor since we're using cookies

export default apiClient;
