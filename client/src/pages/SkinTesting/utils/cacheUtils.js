/**
 * Generic caching utility for API responses
 * Provides configurable cache with expiration and stale-while-revalidate functionality
 */

// Default cache configuration
const DEFAULT_CACHE_CONFIG = {
  MAX_AGE: 5 * 60 * 1000, // 5 minutes default expiration
  STALE_WHILE_REVALIDATE: true, // Return stale data while fetching fresh data
  CACHE_SIZE_LIMIT: 100 // Maximum number of items to store in cache
};

/**
 * Cache class for storing API responses with expiration
 */
class ApiCache {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.store = new Map();
    this.keyTimestamps = []; // For tracking LRU items
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to store
   * @param {Object} options - Optional cache settings for this item
   */
  set(key, value, options = {}) {
    // Manage cache size - remove oldest item if at limit
    if (this.store.size >= this.config.CACHE_SIZE_LIMIT && !this.store.has(key)) {
      const oldestKey = this.keyTimestamps.shift();
      if (oldestKey) this.store.delete(oldestKey);
    }

    // Remove key from timestamps if it exists
    const existingIndex = this.keyTimestamps.indexOf(key);
    if (existingIndex > -1) {
      this.keyTimestamps.splice(existingIndex, 1);
    }

    // Add key to end of timestamps (most recently used)
    this.keyTimestamps.push(key);

    // Store the value with metadata
    this.store.set(key, {
      value,
      timestamp: Date.now(),
      options: { ...this.config, ...options }
    });
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    const { value, timestamp, options } = item;
    const age = Date.now() - timestamp;
    
    // Update key position in timestamps (mark as recently used)
    const existingIndex = this.keyTimestamps.indexOf(key);
    if (existingIndex > -1) {
      this.keyTimestamps.splice(existingIndex, 1);
      this.keyTimestamps.push(key);
    }
    
    // Check if item is expired
    if (age > options.MAX_AGE) {
      if (!options.STALE_WHILE_REVALIDATE) {
        this.delete(key);
        return null;
      }
      // Mark as stale but return value
      item.isStale = true;
    }
    
    return value;
  }

  /**
   * Check if a value is stale and needs revalidation
   * @param {string} key - Cache key
   * @returns {boolean} - True if item exists and is stale
   */
  isStale(key) {
    const item = this.store.get(key);
    if (!item) return false;
    
    const { timestamp, options } = item;
    return Date.now() - timestamp > options.MAX_AGE;
  }

  /**
   * Delete a specific item from the cache
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    this.store.delete(key);
    const index = this.keyTimestamps.indexOf(key);
    if (index > -1) {
      this.keyTimestamps.splice(index, 1);
    }
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.store.clear();
    this.keyTimestamps = [];
  }

  /**
   * Clear all items related to a specific resource
   * @param {string} resourcePrefix - Resource prefix to match (e.g., 'skin-tests')
   */
  clearResource(resourcePrefix) {
    if (!resourcePrefix) return;
    
    const keysToDelete = [];
    
    // Find all keys that start with the resource prefix
    for (const key of this.store.keys()) {
      if (key.startsWith(resourcePrefix)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete the matched keys
    keysToDelete.forEach(key => this.delete(key));
  }
}

// Create cache instances for different resources
const skinTestCache = new ApiCache();
const tokenCache = new ApiCache();
const phoneNumberCache = new ApiCache({
  MAX_AGE: 30 * 60 * 1000 // 30 minutes for phone numbers
});

// Export cache instances and the ApiCache class
export {
  ApiCache,
  skinTestCache,
  tokenCache,
  phoneNumberCache
};

// Simple in-memory cache utility
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  // Set a value in the cache with an optional TTL (time to live)
  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, value);
    
    // Clear any existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    
    // Set a new timeout to remove the entry after TTL
    if (ttl > 0) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.timeouts.delete(key);
      }, ttl);
      
      this.timeouts.set(key, timeout);
    }
  }

  // Get a value from the cache
  get(key) {
    return this.cache.get(key);
  }

  // Check if a key exists in the cache
  has(key) {
    return this.cache.has(key);
  }

  // Delete a key from the cache
  delete(key) {
    this.cache.delete(key);
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  // Clear all entries from the cache
  clear() {
    this.cache.clear();
    
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }
}

// Create a singleton instance
const phoneNumbersCache = new SimpleCache();

export { phoneNumbersCache };
