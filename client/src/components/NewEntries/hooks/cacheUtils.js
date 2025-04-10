/**
 * Caching utility for customer API responses
 */

// Cache configuration
const CACHE_CONFIG = {
  MAX_AGE: 5 * 60 * 1000, // 5 minutes default expiration
  STALE_WHILE_REVALIDATE: true, // Return stale data while fetching fresh data
  CACHE_SIZE_LIMIT: 100 // Maximum number of items to store in cache
};

class CustomerCache {
  constructor(config = {}) {
    this.config = { ...CACHE_CONFIG, ...config };
    this.store = new Map();
    this.keyTimestamps = [];
  }

  set(key, value, options = {}) {
    if (this.store.size >= this.config.CACHE_SIZE_LIMIT && !this.store.has(key)) {
      const oldestKey = this.keyTimestamps.shift();
      if (oldestKey) this.store.delete(oldestKey);
    }

    const existingIndex = this.keyTimestamps.indexOf(key);
    if (existingIndex > -1) {
      this.keyTimestamps.splice(existingIndex, 1);
    }

    this.keyTimestamps.push(key);

    this.store.set(key, {
      value,
      timestamp: Date.now(),
      options: { ...this.config, ...options }
    });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    const { value, timestamp, options } = item;
    const age = Date.now() - timestamp;
    
    const existingIndex = this.keyTimestamps.indexOf(key);
    if (existingIndex > -1) {
      this.keyTimestamps.splice(existingIndex, 1);
      this.keyTimestamps.push(key);
    }
    
    if (age > options.MAX_AGE) {
      if (!options.STALE_WHILE_REVALIDATE) {
        this.delete(key);
        return null;
      }
      item.isStale = true;
    }
    
    return value;
  }

  isStale(key) {
    const item = this.store.get(key);
    if (!item) return false;
    
    const { timestamp, options } = item;
    return Date.now() - timestamp > options.MAX_AGE;
  }

  delete(key) {
    this.store.delete(key);
    const index = this.keyTimestamps.indexOf(key);
    if (index > -1) {
      this.keyTimestamps.splice(index, 1);
    }
  }

  clear() {
    this.store.clear();
    this.keyTimestamps = [];
  }
}

// Create a singleton instance for customer data caching
const customerCache = new CustomerCache();

export { CustomerCache, customerCache };