import { getApi } from './api';

const pureExchangeService = {
  // Get all pure exchanges
  getPureExchanges: async () => {
    const api = await getApi();
    const response = await api.get('/pure-exchange');
    return response.data.data || [];
  },

  // Create a new pure exchange
  createPureExchange: async (data) => {
    const api = await getApi();
    const response = await api.post('/pure-exchange', {
      ...data,
      token_no: data.tokenNo // Convert tokenNo to token_no for backend compatibility
    });
    return response.data;
  },

  // Update an existing pure exchange
  updatePureExchange: async (tokenNo, data) => {
    const api = await getApi();
    const response = await api.put(`/pure-exchange/${tokenNo}`, {
      ...data,
      token_no: data.tokenNo
    });
    return response.data;
  },

  // Delete a pure exchange
  deletePureExchange: async (tokenNo) => {
    const api = await getApi();
    const response = await api.delete(`/pure-exchange/${tokenNo}`);
    return response.data;
  },

  // Check if a pure exchange exists for a token number
  checkPureExchangeExists: async (tokenNo) => {
    const api = await getApi();
    try {
      const response = await api.get(`/pure-exchange/${tokenNo}`);
      return response.data.exists || false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  },

  // Get a single pure exchange by token number
  getPureExchange: async (tokenNo) => {
    const api = await getApi();
    try {
      const response = await api.get(`/pure-exchange/${tokenNo}`);
      return response.data.data || null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }
};

export default pureExchangeService;
