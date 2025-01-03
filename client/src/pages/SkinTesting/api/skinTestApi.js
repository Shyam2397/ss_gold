import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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
  return await axios.put(`${API_URL}/skin-tests/${tokenNo}`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const deleteSkinTest = async (tokenNo) => {
  return await axios.delete(`${API_URL}/skin-tests/${tokenNo}`);
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
