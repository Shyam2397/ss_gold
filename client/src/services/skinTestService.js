import { getApi } from './api';

const skinTestService = {
  // Get all skin tests
  getSkinTests: async () => {
    const api = await getApi();
    const response = await api.get('/skin-tests');
    // Sort by token number in descending order
    return response.data.sort((a, b) => {
      const tokenA = a.token_no || a.tokenNo;
      const tokenB = b.token_no || b.tokenNo;
      return parseFloat(tokenB) - parseFloat(tokenA);
    });
  },

  // Create a new skin test
  createSkinTest: async (data) => {
    const api = await getApi();
    // Process numeric fields
    const numericFields = [
      'weight', 'highest', 'average', 'gold_fineness', 'karat',
      'silver', 'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
      'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
      'indium', 'titanium', 'palladium', 'platinum', 'others'
    ];

    const formattedData = {
      ...data,
      tokenNo: data.tokenNo || data.token_no,
      date: data.date,
      time: data.time,
      name: data.name || '',
      sample: data.sample || '',
      remarks: data.remarks || '',
      code: data.code || ''
    };

    // Ensure numeric fields are properly formatted
    numericFields.forEach(field => {
      const value = data[field];
      formattedData[field] = value === '' || value === null || value === undefined ? 
        0 : 
        parseFloat(value) || 0;
    });

    const response = await api.post('/skin-tests', formattedData);
    return response.data;
  },

  // Update an existing skin test
  updateSkinTest: async (tokenNo, data) => {
    const api = await getApi();
    const response = await api.put(`/skin-tests/${tokenNo}`, data);
    return response.data;
  },

  // Delete a skin test
  deleteSkinTest: async (tokenNo) => {
    const api = await getApi();
    const response = await api.delete(`/skin-tests/${tokenNo}`);
    return response.data;
  },

  // Get token data
  getTokenData: async (tokenNo) => {
    const api = await getApi();
    const response = await api.get(`/tokens/${tokenNo}`);
    
    // Check if the response has the expected structure
    if (response.data && response.data.success && response.data.data) {
      return response.data.data; // Return the nested data object
    }
    
    // If the token is not found, the backend returns success: false
    if (response.data && response.data.success === false) {
      return null;
    }
    
    // For backward compatibility, return the response as is
    return response.data;
  },

  // Get phone number by code
  getPhoneNumber: async (code) => {
    const api = await getApi();
    const response = await api.get(`/entries/code/${code}`);
    return response.data.phone || '';
  }
};

export default skinTestService;
