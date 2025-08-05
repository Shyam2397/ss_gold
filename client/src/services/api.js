import axios from 'axios';

// Dynamically get the API URL from the main process or environment
const getApiUrl = async () => {
  if (window.electron && typeof window.electron.getApiUrl === 'function') {
    const url = await window.electron.getApiUrl();
    return url || import.meta.env.VITE_API_URL;
  }
  return import.meta.env.VITE_API_URL;
};

// Create axios instance with default config
const createApiInstance = async () => {
  const baseURL = await getApiUrl();
  
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for auth token
  instance.interceptors.request.use(
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

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export a function that returns a configured axios instance
export const getApi = () => createApiInstance();

export default {
  getApi,
};
