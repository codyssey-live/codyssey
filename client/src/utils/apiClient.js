import axios from 'axios';

const apiURL = process.env.NODE_ENV === 'production' 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:8080';

// Create an axios instance with default configurations
const apiClient = axios.create({
  baseURL: `${apiURL}/api`,
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
