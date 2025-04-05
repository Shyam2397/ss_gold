import axios from 'axios';
import { skinTestCache, tokenCache, phoneNumberCache } from '../utils/cacheUtils';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchSkinTests = async () => {
  // Check cache first
  const cacheKey = 'skin-tests';
  const cachedData = skinTestCache.get(cacheKey);
  
  if (cachedData) {
    // If data is stale, revalidate in background but return cached data immediately
    if (skinTestCache.isStale(cacheKey)) {
      // Use Promise to fetch in background without awaiting
      fetchSkinTestsFromApi().catch(console.error);
    }
    return cachedData;
  }
  
  return fetchSkinTestsFromApi();
};

// Helper function to fetch skin tests from API
const fetchSkinTestsFromApi = async () => {
  const response = await axios.get(`${API_URL}/skin-tests`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  const sortedData = response.data.sort((a, b) => {
    const tokenA = a.token_no || a.tokenNo;
    const tokenB = b.token_no || b.tokenNo;
    return parseFloat(tokenB) - parseFloat(tokenA);
  });
  
  // Store in cache
  skinTestCache.set('skin-tests', sortedData);
  
  return sortedData;
};

export const createSkinTest = async (data) => {
  try {
    // Numeric fields list
    const numericFields = [
      'weight', 'highest', 'average', 'gold_fineness', 'karat',
      'silver', 'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
      'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
      'indium', 'titanium', 'palladium', 'platinum', 'others'
    ];

    // Process data
    const formattedData = {
      ...data,
      tokenNo: data.tokenNo || data.token_no, // Keep tokenNo for consistency
      date: data.date, // Pass date directly without manipulation
      time: data.time,
      name: data.name || '',
      sample: data.sample || '',
      remarks: data.remarks || '',
      code: data.code || ''
    };

    if (!formattedData.tokenNo) {
      throw new Error('Token number is required');
    }

    // Handle numeric fields
    numericFields.forEach(field => {
      const value = data[field];
      formattedData[field] = value === '' || value === null || value === undefined ? 
        0 : 
        parseFloat(value) || 0;
    });

    const response = await axios.post(`${API_URL}/skin-tests`, formattedData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Invalidate cache after successful creation
    skinTestCache.clearResource('skin-tests');
    
    return response;
  } catch (error) {
    // Simplified error handling
    throw error;
  }
};

export const updateSkinTest = async (tokenNo, data) => {
  try {
    // Pass date directly without manipulation
    const response = await axios.put(`${API_URL}/skin-tests/${tokenNo}`, data);
    
    // Invalidate cache after successful update
    skinTestCache.clearResource('skin-tests');
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Skin test not found');
    }

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
      // Invalidate cache after successful deletion
      skinTestCache.clearResource('skin-tests');
      
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
  if (!tokenNo) {
    throw new Error('Token number is required');
  }
  
  // Check cache first
  const cacheKey = `token-${tokenNo}`;
  const cachedData = tokenCache.get(cacheKey);
  
  if (cachedData) {
    // If data is stale, revalidate in background but return cached data immediately
    if (tokenCache.isStale(cacheKey)) {
      // Use Promise to fetch in background without awaiting
      fetchTokenDataFromApi(tokenNo).catch(console.error);
    }
    return cachedData;
  }
  
  return fetchTokenDataFromApi(tokenNo);
};

// Helper function to fetch token data from API
const fetchTokenDataFromApi = async (tokenNo) => {
  const response = await axios.get(`${API_URL}/tokens/${tokenNo}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  // Store in cache
  tokenCache.set(`token-${tokenNo}`, response);
  
  // Return the response as-is, without any date manipulation
  return response;
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Queue for batching phone number requests
let phoneNumberQueue = [];
let isProcessingQueue = false;
let queueCallbacks = new Map();

// Process the phone number queue in batches
const processPhoneNumberQueue = async (retries = 2, backoff = 2000) => {
  if (isProcessingQueue || phoneNumberQueue.length === 0) return;
  
  isProcessingQueue = true;
  const currentBatch = [...phoneNumberQueue];
  phoneNumberQueue = [];
  
  // Create a unique set of codes to fetch
  const uniqueCodes = [...new Set(currentBatch)];
  
  // Check cache first for all codes
  const results = {};
  const codesToFetch = [];
  
  // Check which codes are already in cache
  uniqueCodes.forEach(code => {
    const cacheKey = `phone-${code}`;
    const cachedData = phoneNumberCache.get(cacheKey);
    
    if (cachedData) {
      results[code] = cachedData;
    } else {
      codesToFetch.push(code);
    }
  });
  
  // If we have codes to fetch, make a batch API call
  if (codesToFetch.length > 0) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Make a single API call with multiple codes
        const response = await axios.get(`${API_URL}/entries`, { 
          params: { code: codesToFetch.join(',') },
          timeout: 8000, // Increased timeout for batch requests
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Process the response data
        if (Array.isArray(response.data)) {
          // Handle array response (multiple entries)
          response.data.forEach(entry => {
            if (entry.code && entry.phoneNumber) {
              const code = entry.code.toString();
              results[code] = entry.phoneNumber;
              // Cache each result
              phoneNumberCache.set(`phone-${code}`, entry.phoneNumber);
            }
          });
        } else if (response.data?.code && response.data?.phoneNumber) {
          // Handle single object response
          const code = response.data.code.toString();
          results[code] = response.data.phoneNumber;
          // Cache the result
          phoneNumberCache.set(`phone-${code}`, response.data.phoneNumber);
        }
        
        // No need to retry if successful
        break;
      } catch (err) {
        const isRetryable = 
          err.code === 'ECONNABORTED' || 
          err.response?.status === 503 || 
          !err.response;

        if (!isRetryable || attempt === retries - 1) {
          // On final failure, we'll return null for these codes
          break;
        }

        await delay(backoff * Math.pow(2, attempt));
      }
    }
  }
  
  // Resolve all callbacks with their results
  currentBatch.forEach(code => {
    const callbacks = queueCallbacks.get(code) || [];
    callbacks.forEach(callback => callback(results[code] || null));
    queueCallbacks.delete(code);
  });
  
  isProcessingQueue = false;
  
  // If more requests came in while processing, handle them
  if (phoneNumberQueue.length > 0) {
    setTimeout(() => processPhoneNumberQueue(retries, backoff), 0);
  }
};

// Batch-optimized function to fetch phone numbers
export const fetchPhoneNumbers = async (codes, retries = 2, backoff = 2000) => {
  if (!codes || !Array.isArray(codes) || codes.length === 0) return {};
  
  // Filter out empty codes
  const validCodes = codes.filter(code => code);
  if (validCodes.length === 0) return {};
  
  // Create a map to store results
  const results = {};
  
  // Check cache first for all codes
  validCodes.forEach(code => {
    const cacheKey = `phone-${code}`;
    const cachedData = phoneNumberCache.get(cacheKey);
    
    if (cachedData) {
      results[code] = cachedData;
    }
  });
  
  // Find codes that need to be fetched
  const codesToFetch = validCodes.filter(code => !results[code]);
  
  if (codesToFetch.length > 0) {
    // Add codes to the queue
    phoneNumberQueue.push(...codesToFetch);
    
    // Create promises for each code that needs to be fetched
    const promises = codesToFetch.map(code => {
      return new Promise(resolve => {
        // Store the callback for this code
        if (!queueCallbacks.has(code)) {
          queueCallbacks.set(code, []);
        }
        queueCallbacks.get(code).push(resolve);
      });
    });
    
    // Start processing the queue
    setTimeout(() => processPhoneNumberQueue(retries, backoff), 0);
    
    // Wait for all promises to resolve
    const fetchedResults = await Promise.all(promises);
    
    // Add fetched results to the results map
    codesToFetch.forEach((code, index) => {
      results[code] = fetchedResults[index];
    });
  }
  
  return results;
};

// Maintain backward compatibility with existing code
export const fetchPhoneNumber = async (code, retries = 2, backoff = 2000) => {
  if (!code) return null;

  // Check cache first
  const cacheKey = `phone-${code}`;
  const cachedData = phoneNumberCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  // Use the batch function but for a single code
  const results = await fetchPhoneNumbers([code], retries, backoff);
  return results[code] || null;
};
