import { getApi } from './api';

// Prefer the server message, fall back to a generic one for network failures
const extractErrorMessage = (err, fallback) => {
  if (err.response) {
    const { status, data } = err.response;
    if (status === 400) return data?.error || data?.detail || 'Please check the details and try again.';
    if (status === 401) return data?.error || 'Invalid username or password';
    if (status === 404) return data?.error || 'Account not found';
    if (status === 500) return 'Server error. Please try again later.';
    return data?.error || data?.detail || fallback;
  }
  if (err.request) {
    return 'Unable to connect to server. Please check that the application is running.';
  }
  return err.message || fallback;
};

export const storeSession = ({ token, user }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user || {}));
  localStorage.setItem('isLoggedIn', 'true');
};

export const updateStoredUser = (user) => {
  if (!user) return;
  localStorage.setItem('user', JSON.stringify(user));
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

    const api = await getApi();
    const response = await api.post('/auth/login', {
      username,
      password,
    });

    // Handle successful response
    if (response.data.success) {
      // Store token and user info
      storeSession({ token: response.data.token, user: response.data.user });

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
            error: data?.error || 'An unexpected error occurred'
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

// Load the account details of the logged in user from the server
export const fetchProfile = async () => {
  try {
    const api = await getApi();
    const response = await api.get('/auth/me');

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.error || 'Failed to load account details'
      };
    }

    updateStoredUser(response.data.user);

    return {
      success: true,
      user: response.data.user
    };
  } catch (err) {
    return {
      success: false,
      error: extractErrorMessage(err, 'Failed to load account details')
    };
  }
};

// Update the password of the logged in user
export const changePassword = async ({ currentPassword = '', newPassword, confirmPassword }) => {
  try {
    if (!newPassword || !confirmPassword) {
      return {
        success: false,
        error: 'New password and confirm password are required'
      };
    }

    const api = await getApi();
    const response = await api.post('/auth/change-password', {
      currentPassword: currentPassword || undefined,
      newPassword,
      confirmPassword,
    });

    if (response.data.success) {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      updateStoredUser(response.data.user);

      return {
        success: true,
        message: response.data.message || 'Password updated successfully',
        user: response.data.user
      };
    }

    return {
      success: false,
      error: response.data.error || 'Failed to update password'
    };
  } catch (err) {
    return {
      success: false,
      error: extractErrorMessage(err, 'Failed to update password')
    };
  }
};
