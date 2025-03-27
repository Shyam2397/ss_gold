import React from 'react';

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

// Define route priorities
const ROUTE_PRIORITIES = {
  '/dashboard': 1,
  '/entries': 1, // Keep entries as high priority
  '/token': 2,
  '/skin-testing': 2,
  // ...other routes with lower priorities
};

// Add specific handling for New Entries
const SCROLL_BEHAVIOR = {
  '/entries': {
    restorePosition: true,
    maintainScroll: true
  }
};

export { SCROLL_BEHAVIOR };

// Optimize route definitions with chunks and priorities
export const routes = [
  {
    path: '/dashboard',
    Component: Dashboard,
    preload: () => import(/* webpackPrefetch: true */ '../pages/Dashboard/Dashboard'),
    priority: ROUTE_PRIORITIES['/dashboard']
  },
  {
    path: '/entries',
    Component: NewEntries,
    preload: () => import(/* webpackPrefetch: true */ '../components/NewEntries/NewEntries'),
    priority: ROUTE_PRIORITIES['/entries']
  },
  {
    path: '/token',
    Component: Token,
    preload: () => import(/* webpackPrefetch: true */ '../pages/Token/index'),
    priority: ROUTE_PRIORITIES['/token']
  },
  {
    path: '/skin-testing',
    Component: SkinTesting,
    preload: () => import(/* webpackPrefetch: true */ '../pages/SkinTesting'),
    priority: ROUTE_PRIORITIES['/skin-testing']
  },
  {
    path: '/photo-testing',
    Component: PhotoTesting,
    preload: () => import('../pages/PhotoTesting'),
    priority: ROUTE_PRIORITIES['/photo-testing']
  },
  {
    path: '/customer-data',
    Component: CustomerDataPage,
    preload: () => import('../pages/CustomerData/CustomerDataPage'),
    priority: ROUTE_PRIORITIES['/customer-data']
  },
  {
    path: '/token-data',
    Component: Tokendata,
    preload: () => import('../pages/TokenData/TokenDataPage'),
    priority: ROUTE_PRIORITIES['/token-data']
  },
  {
    path: '/skintest-data',
    Component: Skintestdata,
    preload: () => import('../pages/SkinTestData/SkinTestDataPage'),
    priority: ROUTE_PRIORITIES['/skintest-data']
  },
  {
    path: '/pure-exchange',
    Component: PureExchange,
    preload: () => import('../pages/PureExchange/PureExchange'),
    priority: ROUTE_PRIORITIES['/pure-exchange']
  },
  {
    path: '/exchange-data',
    Component: ExchangeDataPage,
    preload: () => import('../pages/ExchangeData/ExchangeDataPage'),
    priority: ROUTE_PRIORITIES['/exchange-data']
  }
];

// Enhanced preload function with priority queue
let preloadQueue = new Set();

export const preloadRoute = (path) => {
  const route = routes.find(r => r.path === path);
  if (route?.preload && !preloadQueue.has(path)) {
    preloadQueue.add(path);
    const priority = ROUTE_PRIORITIES[path] || 3;
    
    if (priority === 1) {
      // Immediate load for high priority routes
      route.preload();
    } else {
      // Delayed load for lower priority routes
      requestIdleCallback(() => {
        route.preload();
        preloadQueue.delete(path);
      });
    }
  }
};
