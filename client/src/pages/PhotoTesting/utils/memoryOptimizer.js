/**
 * Memory optimization utilities for PhotoTesting module
 * Handles canvas cleanup, buffer management, and memory leak prevention
 */

export class CanvasMemoryManager {
  constructor() {
    this.canvasPool = [];
    this.activeCanvases = new Set();
    this.maxPoolSize = 5;
  }

  /**
   * Get a reusable canvas from pool or create new one
   */
  getCanvas(width, height) {
    let canvas = this.canvasPool.pop();
    
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    
    canvas.width = width;
    canvas.height = height;
    this.activeCanvases.add(canvas);
    
    return canvas;
  }

  /**
   * Return canvas to pool for reuse
   */
  releaseCanvas(canvas) {
    if (!canvas) return;
    
    this.activeCanvases.delete(canvas);
    
    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Reset dimensions to save memory
    canvas.width = 1;
    canvas.height = 1;
    
    // Add to pool if under limit
    if (this.canvasPool.length < this.maxPoolSize) {
      this.canvasPool.push(canvas);
    }
  }

  /**
   * Force cleanup of all canvases
   */
  cleanup() {
    // Clean active canvases
    this.activeCanvases.forEach(canvas => {
      canvas.width = 1;
      canvas.height = 1;
    });
    this.activeCanvases.clear();
    
    // Clean pool
    this.canvasPool.forEach(canvas => {
      canvas.width = 1;
      canvas.height = 1;
    });
    this.canvasPool = [];
  }
}

// Global instance
export const canvasManager = new CanvasMemoryManager();

/**
 * Memory-efficient image data processing
 */
export const processImageDataChunked = async (imageData, processor, chunkSize = 1000000) => {
  const data = imageData.data;
  const chunks = Math.ceil(data.length / chunkSize);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    
    // Process chunk
    processor(data, start, end);
    
    // Yield control to prevent blocking
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
};

/**
 * Memory-efficient blob URL management
 */
export class BlobUrlManager {
  constructor() {
    this.urls = new Set();
  }

  createUrl(blob) {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  releaseUrl(url) {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  cleanup() {
    this.urls.forEach(url => URL.revokeObjectURL(url));
    this.urls.clear();
  }
}

// Memory monitoring for development
export const memoryMonitor = {
  logMemoryUsage() {
    if (performance.memory && process.env.NODE_ENV === 'development') {
      console.log('📊 Memory Usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  },

  checkMemoryPressure() {
    if (performance.memory) {
      const ratio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      return ratio > 0.7; // High memory pressure
    }
    return false;
  }
};