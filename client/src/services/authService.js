import axios from 'axios';

export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
      username,
      password,
    });

    if (response.status === 200) {
      // Store login state in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      return { success: true };
    }
  } catch (err) {
    // Handle different error scenarios
    if (err.response && err.response.status === 401) {
      return { 
        success: false, 
        error: 'Invalid username or password' 
      };
    }
    
    return { 
      success: false, 
      error: 'Login failed. Please try again.' 
    };
  }
};

export const logoutUser = () => {
  localStorage.removeItem('isLoggedIn');
};

export const isAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};
