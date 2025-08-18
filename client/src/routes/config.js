export const ROUTE_PRIORITIES = {
  '/dashboard': { priority: 1, preloadChunks: true },
  '/entries': { priority: 1, preloadChunks: true, keepInMemory: true },
  '/token': { priority: 2, preloadChunks: false },
  '/skin-testing': { priority: 2, preloadChunks: false },
  '/cash-adjustments': { priority: 2, preloadChunks: true },
  '/cashbook': { priority: 2, preloadChunks: true, keepInMemory: true }
};

export const SCROLL_BEHAVIOR = {
  '/entries': {
    restorePosition: true,
    maintainScroll: true
  }
};

export const ROUTE_CONFIG = {
  dashboard: {
    path: '/dashboard',
    priority: 1,
    preloadChunks: true,
    cacheControl: 'public, max-age=3600'
  }
};
