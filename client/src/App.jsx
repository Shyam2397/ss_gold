import React, { Suspense, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Login from './components/login/Login';
import MainLayout from './components/mainLayout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import routes, { preloadRoute } from './routes';
import { SCROLL_BEHAVIOR } from './routes/config';
import { metrics } from './utils/performance';
import { NavigationProvider } from './components/navigation/NavigationContext';

// Prefetch component for route preloading
const PreFetchComponent = () => {
  const location = useLocation();
  const prefetchedRoutes = useRef(new Set());
  const routeAnalytics = useRef(new Map());
  const MAX_PREFETCH = 5;
  
  // Track route usage patterns
  const updateRouteAnalytics = useCallback((path) => {
    const current = routeAnalytics.current.get(path) || 0;
    routeAnalytics.current.set(path, current + 1);
  }, []);

  const getPrefetchPriority = useCallback((route) => {
    const usage = routeAnalytics.current.get(route.path) || 0;
    return (route.priority || 0) + (usage * 0.5); // Blend static and dynamic priority
  }, []);

  // Check network conditions
  const checkNetworkConditions = useCallback(() => {
    if (!navigator.connection) return true;
    const connection = navigator.connection;
    return !(connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  }, []);

  // Modified debounce with network check
  const debouncePreload = useCallback((fn) => {
    let timeout;
    return (...args) => {
      if (!checkNetworkConditions()) return;
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), 300);
    };
  }, [checkNetworkConditions]);

  useEffect(() => {
    updateRouteAnalytics(location.pathname);
    const prefetchLinks = [];
    const controller = new AbortController();
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          debouncedPreload(); // Start prefetching after LCP
        }
      }
    });

    const debouncedPreload = debouncePreload(() => {
      const routesToPrefetch = routes
        .filter(route => route.path !== location.pathname && 
                        !prefetchedRoutes.current.has(route.path))
        .sort((a, b) => getPrefetchPriority(b) - getPrefetchPriority(a))
        .slice(0, MAX_PREFETCH);

      // Use requestIdleCallback for non-critical prefetching
      window.requestIdleCallback(() => {
        routesToPrefetch.forEach(route => {
          try {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route.path;
            link.setAttribute('importance', 'low');
            document.head.appendChild(link);
            prefetchLinks.push(link);
            prefetchedRoutes.current.add(route.path);
            
            // Progressive loading with priority
            if (route.priority === 'high') {
              preloadRoute(route.path).catch(console.warn);
            } else {
              setTimeout(() => {
                preloadRoute(route.path).catch(console.warn);
              }, 800);
            }
          } catch (error) {
            console.warn(`Prefetch failed for ${route.path}:`, error);
          }
        });
      }, { timeout: 1000 });
    });

    // Start observing LCP
    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => {
      controller.abort();
      observer.disconnect();
      prefetchLinks.forEach(link => link.parentNode?.removeChild(link));
      clearTimeout(debouncePreload.current);
    };
  }, [location, debouncePreload, getPrefetchPriority, updateRouteAnalytics]);

  return null;
};

const AppRoutes = ({ loggedIn, setLoggedIn }) => {
  const location = useLocation();

  useEffect(() => {
    // Ensure proper scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <ErrorBoundary>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            loggedIn ? (
              <MainLayout setLoggedIn={setLoggedIn} />
            ) : (
              <Login setLoggedIn={setLoggedIn} />
            )
          }
        >
          {routes.map(({ path, Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          ))}
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => console.error('SW registration failed:', error));
    }

    // Setup performance monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'measure') {
          console.log(`Route performance: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);

  return (
    <NavigationProvider timeout={15000}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <PreFetchComponent />
          <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
        </Router>
      </QueryClientProvider>
    </NavigationProvider>
  );
}

export default App;
