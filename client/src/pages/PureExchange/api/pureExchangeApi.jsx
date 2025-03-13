import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const createPureExchange = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/pure-exchange`, {
      ...data,
      token_no: data.tokenNo // Convert tokenNo to token_no for backend compatibility
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating pure exchange:', error);
    throw error;
  }
};

export const fetchPureExchanges = async () => {
  try {
    const response = await axios.get(`${API_URL}/pure-exchange`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching pure exchanges:', error);
    throw error;
  }
};

export const updatePureExchange = async (tokenNo, data) => {
  try {
    const response = await axios.put(`${API_URL}/pure-exchange/${tokenNo}`, {
      ...data,
      token_no: data.tokenNo
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating pure exchange:', error);
    throw error;
  }
};

export const deletePureExchange = async (tokenNo) => {
  try {
    const response = await axios.delete(`${API_URL}/pure-exchange/${tokenNo}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting pure exchange:', error);
    throw error;
  }
};

export const checkPureExchangeExists = async (tokenNo) => {
  try {
    const response = await axios.get(`${API_URL}/pure-exchange/${tokenNo}`);
    return response.data.exists || false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    console.error('Error checking pure exchange existence:', error);
    throw error;
  }
};
