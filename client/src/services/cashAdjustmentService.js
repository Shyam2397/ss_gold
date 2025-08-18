import api from './api';

const cashAdjustmentService = {
  async getAdjustments(filters = {}) {
    const response = await (await api.getApi()).get('/api/cash-adjustments', { params: filters });
    return response.data.data || [];
  },

  async createAdjustment(adjustmentData) {
    const response = await (await api.getApi()).post('/api/cash-adjustments', adjustmentData);
    return response.data.data;
  },

  async getAdjustmentById(id) {
    const response = await (await api.getApi()).get(`/api/cash-adjustments/${id}`);
    return response.data.data;
  },

  async updateAdjustment(id, adjustmentData) {
    const response = await (await api.getApi()).put(`/api/cash-adjustments/${id}`, adjustmentData);
    return response.data.data;
  },

  async deleteAdjustment(id) {
    await (await api.getApi()).delete(`/api/cash-adjustments/${id}`);
    return true;
  },

  async getAdjustmentSummary(filters = {}) {
    const response = await (await api.getApi()).get('/api/cash-adjustments/summary', { params: filters });
    return response.data.data || {};
  }
};

export default cashAdjustmentService;
