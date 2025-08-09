import { getApi } from './api';

const entryService = {
  // Get entry by code
  getEntryByCode: async (code) => {
    const api = await getApi();
    const response = await api.get(`/entries?code=${encodeURIComponent(code)}`);
    return response.data[0]; // Return first match or undefined
  },

  // Get all entries
  getEntries: async () => {
    const api = await getApi();
    const response = await api.get('/entries');
    return response.data;
  },

  // Create a new entry
  createEntry: async (entryData) => {
    const api = await getApi();
    const response = await api.post('/entries', entryData);
    return response.data;
  },
  
  // Get entry with phone number by code
  getEntryWithPhone: async (code) => {
    const api = await getApi();
    const response = await api.get(`/entries?code=${encodeURIComponent(code)}&fields=phoneNumber`);
    return response.data[0]; // Return first match or undefined
  },

  // Update an entry
  updateEntry: async (id, entryData) => {
    const api = await getApi();
    const response = await api.put(`/entries/${id}`, entryData);
    return response.data;
  },

  // Delete an entry
  deleteEntry: async (id) => {
    const api = await getApi();
    const response = await api.delete(`/entries/${id}`);
    return response.data;
  }
};

export default entryService;
