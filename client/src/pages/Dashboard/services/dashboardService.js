import { getApi } from '../../../services/api';
import cashAdjustmentService from '../../../services/cashAdjustmentService';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// Clear expired cache entries periodically
setInterval(clearExpiredCache, 60 * 1000); // Every minute

export const fetchTokens = async () => {
  const cacheKey = 'tokens';
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/tokens');
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

export const fetchExpenses = async () => {
  const cacheKey = 'expenses';
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/api/expenses');
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
};

export const fetchEntries = async () => {
  const cacheKey = 'entries';
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/entries');
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching entries:', error);
    return [];
  }
};

export const fetchExchanges = async () => {
  const cacheKey = 'exchanges';
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/pure-exchange');
    const result = data.data || [];
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    return [];
  }
};

export const fetchCashAdjustments = async (filters = {}) => {
  const cacheKey = `cashAdjustments_${JSON.stringify(filters)}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const result = await cashAdjustmentService.getAdjustments(filters);
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching cash adjustments:', error);
    return [];
  }
};
