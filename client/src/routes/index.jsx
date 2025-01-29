import React from 'react';

// Lazy load all components
const Dashboard = React.lazy(() => 
  import(/* webpackChunkName: "dashboard" */ '../pages/Dashboard/Dashboard')
);
const NewEntries = React.lazy(() => 
  import(/* webpackChunkName: "new-entries" */ '../components/NewEntries/NewEntries')
);
const SkinTesting = React.lazy(() => 
  import(/* webpackChunkName: "skin-testing" */ '../pages/SkinTesting')
);
const PhotoTesting = React.lazy(() => 
  import(/* webpackChunkName: "photo-testing" */ '../pages/PhotoTesting')
);
const Token = React.lazy(() => 
  import(/* webpackChunkName: "token" */ '../pages/Token/index')
);
const CustomerDataPage = React.lazy(() => 
  import(/* webpackChunkName: "customer-data" */ '../pages/CustomerData/CustomerDataPage')
);
const Tokendata = React.lazy(() => 
  import(/* webpackChunkName: "token-data" */ '../pages/TokenData/TokenDataPage')
);
const Skintestdata = React.lazy(() => 
  import(/* webpackChunkName: "skintest-data" */ '../pages/SkinTestData/SkinTestDataPage')
);
const PureExchange = React.lazy(() => 
  import(/* webpackChunkName: "pure-exchange" */ '../pages/PureExchange/PureExchange')
);
const ExchangeDataPage = React.lazy(() => 
  import(/* webpackChunkName: "exchange-data" */ '../pages/ExchangeData/ExchangeDataPage')
);

// Define routes with metadata
export const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    preload: () => import('../pages/Dashboard/Dashboard')
  },
  {
    path: '/entries',
    component: NewEntries,
    preload: () => import('../components/NewEntries/NewEntries')
  },
  {
    path: '/token',
    component: Token,
    preload: () => import('../pages/Token/index')
  },
  {
    path: '/skin-testing',
    component: SkinTesting,
    preload: () => import('../pages/SkinTesting')
  },
  {
    path: '/photo-testing',
    component: PhotoTesting,
    preload: () => import('../pages/PhotoTesting')
  },
  {
    path: '/customer-data',
    component: CustomerDataPage,
    preload: () => import('../pages/CustomerData/CustomerDataPage')
  },
  {
    path: '/token-data',
    component: Tokendata,
    preload: () => import('../pages/TokenData/TokenDataPage')
  },
  {
    path: '/skintest-data',
    component: Skintestdata,
    preload: () => import('../pages/SkinTestData/SkinTestDataPage')
  },
  {
    path: '/pure-exchange',
    component: PureExchange,
    preload: () => import('../pages/PureExchange/PureExchange')
  },
  {
    path: '/exchange-data',
    component: ExchangeDataPage,
    preload: () => import('../pages/ExchangeData/ExchangeDataPage')
  }
];

// Preload function for route prefetching
export const preloadRoute = (path) => {
  const route = routes.find(r => r.path === path);
  if (route?.preload) {
    route.preload();
  }
};
