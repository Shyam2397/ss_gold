import React, { Suspense } from 'react';
import { markRouteStart, measureRouteLoad } from '../utils/performance';
import { ROUTE_PRIORITIES, SCROLL_BEHAVIOR } from './config';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Create a higher-order component for better error boundaries and loading states
const withSuspense = (Component) => (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component {...props} />
  </Suspense>
);

// Helper for lazy loading components with retry logic
const lazyLoad = (importFn) => {
  const LazyComponent = React.lazy(() => 
    importFn().catch(error => {
      console.error('Failed to load component:', error);
      return { default: () => <div>Failed to load component.</div> };
    })
  );
  return withSuspense(LazyComponent);
};

// Define components with dynamic imports and code splitting
const Dashboard = lazyLoad(() => import(
  /* webpackChunkName: "dashboard" */
  /* webpackPrefetch: true */
  '../pages/Dashboard/Dashboard'
));

const NewEntries = lazyLoad(() => import(
  /* webpackChunkName: "new-entries" */
  /* webpackPrefetch: true */
  '../components/NewEntries/NewEntries'
));

const SkinTesting = lazyLoad(() => import(
  /* webpackChunkName: "skin-testing" */
  '../pages/SkinTesting'
));

const PhotoTesting = lazyLoad(() => import(
  /* webpackChunkName: "photo-testing" */
  '../pages/PhotoTesting'
));

const Token = lazyLoad(() => import(
  /* webpackChunkName: "token" */
  /* webpackPrefetch: true */
  '../pages/Token/index'
));

const CustomerDataPage = lazyLoad(() => import(
  /* webpackChunkName: "customer-data" */
  /* webpackPrefetch: true */
  '../pages/CustomerData/CustomerDataPage'
));

// Heavy components with separate chunks
const Tokendata = lazyLoad(() => import(
  /* webpackChunkName: "token-data" */
  /* webpackMode: "lazy" */
  '../pages/TokenData/TokenDataPage'
));

const Skintestdata = lazyLoad(() => import(
  /* webpackChunkName: "skintest-data" */
  /* webpackMode: "lazy" */
  '../pages/SkinTestData/SkinTestDataPage'
));

// Heavy charting components with dynamic imports for charting libraries
const PureExchange = lazyLoad(() => 
  Promise.all([
    import('recharts'),
    import(
      /* webpackChunkName: "pure-exchange" */
      /* webpackPrefetch: true */
      '../pages/PureExchange/PureExchange'
    )
  ]).then(([_, module]) => module)
);

const ExchangeDataPage = lazyLoad(() => import(
  /* webpackChunkName: "exchange-data" */
  /* webpackMode: "lazy" */
  '../pages/ExchangeData/ExchangeDataPage'
));

const CashAdjustmentList = lazyLoad(() => import(
  /* webpackChunkName: "cash-adjustment" */
  '../components/cashbook/CashAdjustmentList'
));

const CashBook = lazyLoad(() => import(
  /* webpackChunkName: "cashbook" */
  /* webpackPrefetch: true */
  '../components/cashbook/CashBook'
));

// Enhanced route priorities with contextual information from config

// Preload queue with better memory management and priority
const preloadQueue = new Map();
const MAX_CONCURRENT_PRELOADS = 3; // Limit concurrent prefetches

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

export const preloadRoute = async (path) => {
  markRouteStart(path);
  const route = routesConfig.find(r => r.path === path);
  const routeConfig = ROUTE_PRIORITIES[path];

  if (!route?.preload || preloadQueue.has(path)) {
    return Promise.resolve();
  }

  const metadata = {
    timestamp: Date.now(),
    priority: routeConfig?.priority || 3,
    promise: null
  };
  
  preloadQueue.set(path, metadata);

  const loadStrategy = async () => {
    try {
      // Only preload if we have less than MAX_CONCURRENT_PRELOADS
      const currentPreloads = Array.from(preloadQueue.values())
        .filter(m => m.promise && m.promise !== metadata.promise);
      
      if (currentPreloads.length >= MAX_CONCURRENT_PRELOADS) {
        // Wait for one of the current preloads to finish
        await Promise.race(currentPreloads.map(m => m.promise));
      }

      metadata.promise = retryImport(() => route.preload())
        .then(module => {
          measureRouteLoad(path);
          return module;
        })
        .finally(() => {
          // Clean up after a short delay to handle rapid navigation
          setTimeout(() => preloadQueue.delete(path), 1000);
        });

      return await metadata.promise;
    } catch (error) {
      console.error(`Failed to preload route ${path}:`, error);
      preloadQueue.delete(path);
      throw error;
    }
  };

  // Use requestIdleCallback for non-critical prefetching
  if (window.requestIdleCallback) {
    window.requestIdleCallback(
      () => loadStrategy(),
      { timeout: 2000 } // Don't wait more than 2s
    );
    return Promise.resolve();
  }
  
  return loadStrategy();
};

// Update routes array with enhanced metadata and preloading
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
  },
  {
    path: '/cash-adjustments',
    Component: CashAdjustmentList,
    preload: () => import('../components/cashbook/CashAdjustmentList'),
    ...ROUTE_PRIORITIES['/cash-adjustments']
  },
  {
    path: '/cashbook',
    Component: CashBook,
    preload: () => import('../components/cashbook/CashBook'),
    ...ROUTE_PRIORITIES['/cashbook']
  }
];

export default routesConfig;
export { SCROLL_BEHAVIOR };
