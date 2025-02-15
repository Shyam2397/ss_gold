import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchSkinTests = async () => {
  const response = await axios.get(`${API_URL}/skin-tests`);
  return response.data.data.sort((a, b) => parseFloat(b.tokenNo) - parseFloat(a.tokenNo));
};

export const createSkinTest = async (data) => {
  return await axios.post(`${API_URL}/skin-tests`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const updateSkinTest = async (tokenNo, data) => {
  try {
    console.log('Making update request:', {
      url: `${API_URL}/skin-tests/${tokenNo}`,
      data: data
    });

    const response = await axios.put(`${API_URL}/skin-tests/${tokenNo}`, data, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update API error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 404) {
      throw new Error('Skin test not found');
    }

    // Throw a more specific error message
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
  return await axios.get(`${API_URL}/tokens/${tokenNo}`);
};

export const fetchPhoneNumber = async (code) => {
  if (!code) {
    console.log('No code provided for phone number lookup');
    return null;
  }

  try {
    console.log(`Attempting to fetch phone number for code: ${code}`);
    const response = await axios.get(`${API_URL}/entries`, { params: { code } });
    console.log('Entries response:', response.data);

    let phoneNumber = null;

    if (typeof response.data === 'object') {
      if (response.data.phoneNumber) {
        phoneNumber = response.data.phoneNumber;
      } else if (Array.isArray(response.data)) {
        const matchingEntry = response.data.find(
          (entry) => entry.code === code || entry.code.toString() === code.toString()
        );
        phoneNumber = matchingEntry?.phoneNumber;
      } else if (response.data.code && response.data.phoneNumber) {
        phoneNumber = response.data.phoneNumber;
      }
    }

    if (phoneNumber) {
      console.log('Fetched Phone Number:', phoneNumber);
      return phoneNumber;
    }
    
    console.log(`No phone number found for code: ${code}`);
    return null;
  } catch (err) {
    console.error('Error fetching phone number:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    return null;
  }
};
