import { getApi } from '../../../services/api';
import cashAdjustmentService from '../../../services/cashAdjustmentService';

// Simple in-memory cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache management functions
const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// Periodically clean up expired cache entries
setInterval(clearExpiredCache, 60000); // Every minute

export const fetchTokens = async () => {
  const cacheKey = 'tokens';
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/tokens');
    const result = Array.isArray(data) ? data : [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return []; // Return empty array instead of throwing
  }
};

export const fetchExpenses = async () => {
  const cacheKey = 'expenses';
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/api/expenses');
    const result = Array.isArray(data) ? data : [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return []; // Return empty array instead of throwing
  }
};

export const fetchEntries = async () => {
  const cacheKey = 'entries';
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/entries');
    const result = Array.isArray(data) ? data : [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching entries:', error);
    return []; // Return empty array instead of throwing
  }
};

export const fetchExchanges = async () => {
  const cacheKey = 'exchanges';
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const api = await getApi();
    const { data } = await api.get('/pure-exchange');
    const result = (data && Array.isArray(data.data)) ? data.data : [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    return []; // Return empty array instead of throwing
  }
};

export const fetchCashAdjustments = async (filters = {}) => {
  const cacheKey = `cashAdjustments-${JSON.stringify(filters)}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const result = await cashAdjustmentService.getAdjustments(filters);
    const finalResult = Array.isArray(result) ? result : [];
    setCache(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    console.error('Error fetching cash adjustments:', error);
    return [];
  }
};

// Function to clear all cache
export const clearDashboardCache = () => {
  cache.clear();
};

// Function to clear specific cache entry
export const clearCacheEntry = (key) => {
  cache.delete(key);
};