import React, { Suspense, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { CompanyDetailsProvider } from './context/CompanyDetailsContext';
import { UserProvider, useUser } from './components/UserInterface/UserContext';
import Login from './components/login/Login';
import MainLayout from './components/mainLayout/MainLayout';
import UserInterface from './components/UserInterface/UserInterface';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import routes, { preloadRoute } from './routes';
import { SCROLL_BEHAVIOR } from './routes/config';
import { metrics } from './utils/performance';
import { displayName } from './utils/permissions';

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

const AuthenticatedApp = ({ setLoggedIn }) => {
  const { mustChangePassword, signOut } = useUser();

  // After install the account runs on the shipped default password - keep the
  // rest of the app locked until a new one is set.
  if (mustChangePassword) {
    return (
      <UserInterface
        variant="required"
        onSignOut={() => {
          signOut();
          setLoggedIn(false);
        }}
      />
    );
  }

  return <MainLayout setLoggedIn={setLoggedIn} />;
};

const NoAccess = ({ path }) => {
  const navigate = useNavigate();
  const { firstAccessiblePath } = useUser();
  const fallback = firstAccessiblePath || '/dashboard';

  // Nudge them to a page they can actually open instead of leaving a dead end
  useEffect(() => {
    if (path !== fallback) {
      navigate(fallback, { replace: true });
    }
  }, [path, fallback, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="text-lg font-bold text-amber-900">You do not have access to this page</h2>
        <p className="mt-2 text-sm text-amber-700">
          Ask an administrator to grant you access from Settings, then try again.
        </p>
      </div>
    </div>
  );
};

/**
 * Wraps a route so a user without the matching menu permission is redirected
 * to the first page they are allowed to open.
 */
const PermissionRoute = ({ path, children }) => {
  const { user, canAccess } = useUser();

  // Wait for the account to load so permissions are known before deciding
  if (!user) {
    return <LoadingSpinner />;
  }

  if (!canAccess(path)) {
    return <NoAccess path={path} />;
  }

  return children;
};

const AppRoutes = ({ loggedIn, setLoggedIn }) => {
  useEffect(() => {
    // Ensure proper scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <AuthenticatedApp setLoggedIn={setLoggedIn} />
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
                <PermissionRoute path={path}>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Component />
                    </Suspense>
                  </ErrorBoundary>
                </PermissionRoute>
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
    // Register service worker - DISABLED FOR ELECTRON
    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker.register('/service-worker.js')
    //     .catch(error => console.error('SW registration failed:', error));
    // }

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
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <CompanyDetailsProvider>
          <Router>
            <PreFetchComponent />
            <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
          </Router>
        </CompanyDetailsProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
