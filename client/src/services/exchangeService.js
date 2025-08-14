import { getApi } from './api';

const exchangeService = {
  // Get all exchanges
  getExchanges: async () => {
    const api = await getApi();
    const response = await api.get('/pure-exchange');
    return response.data.data || [];
  },

  // Delete an exchange
  deleteExchange: async (tokenNo) => {
    const api = await getApi();
    const response = await api.delete(`/pure-exchange/${tokenNo}`);
    return response.data;
  },

  // Update an exchange
  updateExchange: async (tokenNo, data) => {
    const api = await getApi();
    const response = await api.put(`/pure-exchange/${tokenNo}`, data);
    return response.data;
  },

  // Check if an exchange exists
  checkExchangeExists: async (tokenNo) => {
    const api = await getApi();
    try {
      const response = await api.get(`/pure-exchange/check/${tokenNo}`);
      return response.data.exists || false;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
};

export default exchangeService;
