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
    return [];
  }
};