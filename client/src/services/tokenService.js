import { getApi } from './api';

const tokenService = {
  // Get all tokens
  getTokens: async () => {
    const api = await getApi();
    const response = await api.get('/tokens');
    return response.data;
  },

  // Get token by ID
  getTokenById: async (id) => {
    const api = await getApi();
    const response = await api.get(`/tokens/${id}`);
    return response.data;
  },

  // Create a new token
  createToken: async (tokenData) => {
    const api = await getApi();
    const response = await api.post('/tokens', tokenData);
    return response.data;
  },

  // Update a token
  updateToken: async (id, tokenData) => {
    const api = await getApi();
    const response = await api.put(`/tokens/${id}`, tokenData);
    return response.data;
  },

  // Delete a token
  deleteToken: async (id) => {
    const api = await getApi();
    const response = await api.delete(`/tokens/${id}`);
    return response.data;
  },

  // Generate token number
  generateTokenNumber: async () => {
    const api = await getApi();
    const response = await api.get('/tokens/generate');
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (id, isPaid) => {
    const api = await getApi();
    const response = await api.patch(`/tokens/${id}/payment`, { isPaid });
    return response.data;
  }
};

export default tokenService;
