import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
  ? import.meta.env.BACKEND_URL
  : 'http://localhost:8080/api';

// Create an axios instance with default configurations
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Add a request interceptor to include authentication token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
