import React from 'react';
import { markRouteStart, measureRouteLoad } from '../utils/performance';
import { ROUTE_PRIORITIES, ROUTE_CONFIG } from './config';

// Define components with proper naming
const Dashboard = React.lazy(() => 
  import('../pages/Dashboard/Dashboard').then(module => ({
    default: module.default || module
  }))
);
const NewEntries = React.lazy(() => 
  import('../components/NewEntries/NewEntries').then(module => ({
    default: module.default || module
  }))
);
const SkinTesting = React.lazy(() => 
  import('../pages/SkinTesting').then(module => ({
    default: module.default || module
  }))
);
const PhotoTesting = React.lazy(() => 
  import('../pages/PhotoTesting').then(module => ({
    default: module.default || module
  }))
);
const Token = React.lazy(() => 
  import('../pages/Token/index').then(module => ({
    default: module.default || module
  }))
);
const CustomerDataPage = React.lazy(() => 
  import('../pages/CustomerData/CustomerDataPage').then(module => ({
    default: module.default || module
  }))
);
const Tokendata = React.lazy(() => 
  import('../pages/TokenData/TokenDataPage').then(module => ({
    default: module.default || module
  }))
);
const Skintestdata = React.lazy(() => 
  import('../pages/SkinTestData/SkinTestDataPage').then(module => ({
    default: module.default || module
  }))
);
const PureExchange = React.lazy(() => 
  import('../pages/PureExchange/PureExchange').then(module => ({
    default: module.default || module
  }))
);
const ExchangeDataPage = React.lazy(() => 
  import('../pages/ExchangeData/ExchangeDataPage').then(module => ({
    default: module.default || module
  }))
);

// Enhanced route priorities with contextual information
const SCROLL_BEHAVIOR = {
  '/entries': {
    restorePosition: true,
    maintainScroll: true
  }
};

export { SCROLL_BEHAVIOR };

// Preload queue with better memory management
const preloadQueue = new Map(); // Using Map for better metadata storage

const retryImport = async (importFn, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw lastError;
};

export const preloadRoute = (path) => {
  markRouteStart(path);
  const route = routesConfig.find(r => r.path === path);
  const routeConfig = ROUTE_PRIORITIES[path];

  if (route?.preload && !preloadQueue.has(path)) {
    const metadata = {
      timestamp: Date.now(),
      priority: routeConfig?.priority || 3
    };
    preloadQueue.set(path, metadata);

    const loadStrategy = () => {
      return retryImport(() => route.preload())
        .then(module => {
          measureRouteLoad(path);
          if (routeConfig?.keepInMemory) {
            // Keep in memory
            preloadQueue.set(path, { ...metadata, loaded: true });
          } else {
            preloadQueue.delete(path);
          }
          return module;
        })
        .catch(error => {
          console.error(`Failed to load route ${path}:`, error);
          throw error;
        });
    };

    if (routeConfig?.priority === 1) {
      return loadStrategy();
    } else {
      return new Promise(resolve => {
        requestIdleCallback(() => resolve(loadStrategy()));
      });
    }
  }
  return Promise.resolve();
};

// Update routes array with enhanced metadata
const routesConfig = [
  {
    path: '/dashboard',
    Component: Dashboard,
    preload: () => import(/* webpackPrefetch: true */ '../pages/Dashboard/Dashboard'),
    ...ROUTE_PRIORITIES['/dashboard']
  },
  {
    path: '/entries',
    Component: NewEntries,
    preload: () => import(/* webpackPrefetch: true */ '../components/NewEntries/NewEntries'),
    ...ROUTE_PRIORITIES['/entries']
  },
  {
    path: '/token',
    Component: Token,
    preload: () => import(/* webpackPrefetch: true */ '../pages/Token/index'),
    ...ROUTE_PRIORITIES['/token']
  },
  {
    path: '/skin-testing',
    Component: SkinTesting,
    preload: () => import(/* webpackPrefetch: true */ '../pages/SkinTesting'),
    ...ROUTE_PRIORITIES['/skin-testing']
  },
  {
    path: '/photo-testing',
    Component: PhotoTesting,
    preload: () => import('../pages/PhotoTesting'),
    ...ROUTE_PRIORITIES['/photo-testing']
  },
  {
    path: '/customer-data',
    Component: CustomerDataPage,
    preload: () => import('../pages/CustomerData/CustomerDataPage'),
    ...ROUTE_PRIORITIES['/customer-data']
  },
  {
    path: '/token-data',
    Component: Tokendata,
    preload: () => import('../pages/TokenData/TokenDataPage'),
    ...ROUTE_PRIORITIES['/token-data']
  },
  {
    path: '/skintest-data',
    Component: Skintestdata,
    preload: () => import('../pages/SkinTestData/SkinTestDataPage'),
    ...ROUTE_PRIORITIES['/skintest-data']
  },
  {
    path: '/pure-exchange',
    Component: PureExchange,
    preload: () => import('../pages/PureExchange/PureExchange'),
    ...ROUTE_PRIORITIES['/pure-exchange']
  },
  {
    path: '/exchange-data',
    Component: ExchangeDataPage,
    preload: () => import('../pages/ExchangeData/ExchangeDataPage'),
    ...ROUTE_PRIORITIES['/exchange-data']
  }
];

export default routesConfig;
