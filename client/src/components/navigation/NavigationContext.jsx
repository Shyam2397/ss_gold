import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigationMetrics } from './NavigationMetrics';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const PROGRESS_INTERVAL = 100;

const NavigationContext = createContext(null);

const defaultContext = {
  isLoading: false,
  loadingRoute: null,
  progress: 0,
  startLoading: () => {},
  stopLoading: () => {},
  error: null,
  setError: () => {},
  retryNavigation: () => {}
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    console.warn('Navigation context not found - using fallback values');
    return defaultContext;
  }
  return context;
};

export const NavigationProvider = ({ children, timeout = DEFAULT_TIMEOUT }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const progressTimer = useRef(null);
  const timeoutTimer = useRef(null);
  const lastNavigation = useRef(null);

  const { trackNavigation } = useNavigationMetrics();
  const routeCache = useRef(new Map());

  const simulateProgress = useCallback(() => {
    setProgress(0);
    clearInterval(progressTimer.current);
    
    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressTimer.current);
          return 90;
        }
        return prev + (90 - prev) * 0.1; // Smoother progress
      });
    }, PROGRESS_INTERVAL);
  }, []);

  const prefetchRoute = useCallback(async (route) => {
    if (routeCache.current.has(route)) return;
    try {
      const response = await fetch(route);
      routeCache.current.set(route, response);
    } catch (error) {
      console.debug(`Prefetch failed for ${route}:`, error);
    }
  }, []);

  const startLoading = useCallback((route) => {
    const startTime = performance.now();
    setError(null);
    setIsLoading(true);
    setLoadingRoute(route);
    lastNavigation.current = { route, startTime };
    simulateProgress();

    // Prefetch next potential routes
    Object.keys(SCROLL_BEHAVIOR || {})
      .filter(r => r !== route)
      .forEach(prefetchRoute);

    // Set timeout protection
    clearTimeout(timeoutTimer.current);
    timeoutTimer.current = setTimeout(() => {
      handleError(new Error(`Navigation timeout: ${route}`));
    }, timeout);
  }, [simulateProgress, timeout, prefetchRoute]);

  const stopLoading = useCallback(() => {
    if (lastNavigation.current) {
      const { route, startTime } = lastNavigation.current;
      trackNavigation(route, startTime);
    }
    setProgress(100);
    clearInterval(progressTimer.current);
    clearTimeout(timeoutTimer.current);
    
    requestAnimationFrame(() => {
      setIsLoading(false);
      setLoadingRoute(null);
      setProgress(0);
    });
  }, [trackNavigation]);

  const handleError = useCallback((err) => {
    console.error('Navigation error:', err);
    setError(err);
    stopLoading();
  }, [stopLoading]);

  const retryNavigation = useCallback(() => {
    if (lastNavigation.current) {
      startLoading(lastNavigation.current.route);
    }
  }, [startLoading]);

  // Cleanup all timers on unmount
  React.useEffect(() => {
    return () => {
      clearInterval(progressTimer.current);
      clearTimeout(timeoutTimer.current);
    };
  }, []);

  return (
    <NavigationContext.Provider 
      value={{ 
        isLoading, 
        loadingRoute,
        progress,
        startLoading,
        stopLoading,
        error,
        setError: handleError,
        retryNavigation
      }}
    >
      <NavigationErrorBoundary>
        {children}
      </NavigationErrorBoundary>
    </NavigationContext.Provider>
  );
};

export class NavigationErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Navigation error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed top-4 right-4 p-4 text-red-600 bg-red-50 rounded shadow-lg">
          <h3 className="font-bold">Navigation Error</h3>
          <p className="text-sm">{this.state.error?.message || 'Something went wrong'}</p>
          <div className="mt-2 flex gap-2">
            <button 
              className="px-3 py-1 bg-red-100 rounded text-sm hover:bg-red-200"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                const { retryNavigation } = useNavigation();
                retryNavigation();
              }}
            >
              Retry
            </button>
            <button 
              className="px-3 py-1 bg-red-100 rounded text-sm hover:bg-red-200"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
