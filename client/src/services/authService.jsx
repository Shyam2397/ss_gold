import axios from 'axios';

// Dynamically get the API URL from the main process
const getApiUrl = async () => {
  if (window.electron && typeof window.electron.getApiUrl === 'function') {
        const url = await window.electron.getApiUrl();
    // In development, if the main process doesn't provide a URL, fallback to Vite's env variable
    return url || import.meta.env.VITE_API_URL;
  }
  // Fallback for running in a standard browser environment
  return import.meta.env.VITE_API_URL;
};

export const loginUser = async (username, password) => {
  try {
    // Validate input
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required'
      };
    }

    // Get the dynamic API URL
    const apiUrl = await getApiUrl();
    if (!apiUrl) {
      return {
        success: false,
        error: 'Could not determine API server address.'
      };
    }

    // Make API request
    const response = await axios.post(`${apiUrl}/auth/login`, {
      username,
      password,
    });

    // Handle successful response
    if (response.data.success) {
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isLoggedIn', 'true');

      return {
        success: true,
        user: response.data.user
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Login failed'
      };
    }
  } catch (err) {
    // Handle different error scenarios
    if (err.response) {
      // Server responded with error
      const { status, data } = err.response;
      
      switch (status) {
        case 400:
          return {
            success: false,
            error: data.detail || 'Invalid input. Please check your username and password.'
          };
        case 401:
          return {
            success: false,
            error: 'Invalid username or password'
          };
        case 500:
          return {
            success: false,
            error: 'Server error. Please try again later.'
          };
        default:
          return {
            success: false,
            error: data.error || 'An unexpected error occurred'
          };
      }
    } else if (err.request) {
      // No response received
      return {
        success: false,
        error: 'Unable to connect to server. Please check your internet connection.'
      };
    } else {
      // Request setup error
      return {
        success: false,
        error: 'Failed to make request. Please try again.'
      };
    }
  }
};

export const logoutUser = () => {
  // Clear all auth-related data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!token || !isLoggedIn) {
    return false;
  }

  // TODO: Add token expiration check
  return true;
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
