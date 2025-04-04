import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
// Add phone number cache
const phoneNumberCache = new Map();

export const fetchSkinTests = async () => {
  const response = await axios.get(`${API_URL}/skin-tests`);
  // Response data is directly the array, no need for .data property
  return response.data.sort((a, b) => {
    const tokenA = a.token_no || a.tokenNo;
    const tokenB = b.token_no || b.tokenNo;
    return parseFloat(tokenB) - parseFloat(tokenA);
  });
};

export const createSkinTest = async (data) => {
  try {
    // Numeric fields list
    const numericFields = [
      'weight', 'highest', 'average', 'gold_fineness', 'karat',
      'silver', 'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
      'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
      'indium', 'titanium', 'palladium', 'platinum', 'others'
    ];

    // Process data
    const formattedData = {
      ...data,
      tokenNo: data.tokenNo || data.token_no, // Keep tokenNo for consistency
      date: data.date, // Pass date directly without manipulation
      time: data.time,
      name: data.name || '',
      sample: data.sample || '',
      remarks: data.remarks || '',
      code: data.code || ''
    };

    if (!formattedData.tokenNo) {
      throw new Error('Token number is required');
    }

    // Handle numeric fields
    numericFields.forEach(field => {
      const value = data[field];
      formattedData[field] = value === '' || value === null || value === undefined ? 
        0 : 
        parseFloat(value) || 0;
    });

    // Removed console.log for formatted data
    const response = await axios.post(`${API_URL}/skin-tests`, formattedData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  } catch (error) {
    // Simplified error handling
    throw error;
  }
};

export const updateSkinTest = async (tokenNo, data) => {
  try {
    // Pass date directly without manipulation
    const response = await axios.put(`${API_URL}/skin-tests/${tokenNo}`, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Skin test not found');
    }

    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to update skin test'
    );
  }
};

export const deleteSkinTest = async (tokenNo) => {
  if (!tokenNo) {
    throw new Error('Token number is required for deletion');
  }

  try {
    const response = await axios.delete(`${API_URL}/skin-tests/${tokenNo}`);
    
    // The server returns { message: 'Deleted' } on success
    if (response.data?.message === 'Deleted') {
      return {
        data: {
          success: true,
          message: 'Skin test deleted successfully'
        }
      };
    }

    // If we get here, something unexpected happened
    throw new Error(response.data?.message || 'Unexpected response from server');
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Skin test not found');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Not authorized to delete this skin test');
    }
    throw error;
  }
};

export const fetchTokenData = async (tokenNo) => {
  const response = await axios.get(`${API_URL}/tokens/${tokenNo}`);
  // Return the response as-is, without any date manipulation
  return response;
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPhoneNumber = async (code, retries = 2, backoff = 2000) => {
  if (!code) return null;

  // Check cache first
  if (phoneNumberCache.has(code)) {
    return phoneNumberCache.get(code);
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(`${API_URL}/entries`, { 
        params: { code },
        timeout: 5000, // Reduced timeout to 5 seconds
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      let phoneNumber = null;

      if (response.data?.phoneNumber) {
        phoneNumber = response.data.phoneNumber;
      } else if (Array.isArray(response.data)) {
        const matchingEntry = response.data.find(
          entry => entry.code?.toString() === code?.toString()
        );
        phoneNumber = matchingEntry?.phoneNumber;
      }

      if (phoneNumber) {
        // Cache the successful result
        phoneNumberCache.set(code, phoneNumber);
        return phoneNumber;
      }

      return null;
    } catch (err) {
      const isRetryable = 
        err.code === 'ECONNABORTED' || 
        err.response?.status === 503 || 
        !err.response;

      if (!isRetryable || attempt === retries - 1) {
        // Remove console.error for failed phone number fetch
        return null;
      }

      await delay(backoff * Math.pow(2, attempt));
    }
  }

  return null;
};

// Clear cache periodically (every 30 minutes)
setInterval(() => phoneNumberCache.clear(), 30 * 60 * 1000);
