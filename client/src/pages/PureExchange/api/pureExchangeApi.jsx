import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const createPureExchange = async (data) => {
  return await axios.post(`${API_URL}/pure-exchange`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const fetchPureExchanges = async () => {
  const response = await axios.get(`${API_URL}/pure-exchange`);
  return response.data.data || [];
};

export const updatePureExchange = async (tokenNo, data) => {
  return await axios.put(`${API_URL}/pure-exchange/${tokenNo}`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const deletePureExchange = async (tokenNo) => {
  return await axios.delete(`${API_URL}/pure-exchange/${tokenNo}`);
};

export const checkPureExchangeExists = async (tokenNo) => {
  try {
    const response = await axios.get(`${API_URL}/pure-exchange/${tokenNo}`);
    return response.data.exists || false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw error;
  }
};
