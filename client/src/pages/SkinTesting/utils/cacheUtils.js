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