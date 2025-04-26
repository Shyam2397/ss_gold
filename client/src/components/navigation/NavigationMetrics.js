import { useRef, useCallback } from 'react';

export const useNavigationMetrics = () => {
  const metrics = useRef({
    navigationTimes: new Map(),
    slowThreshold: 300
  });

  const trackNavigation = useCallback((route, startTime) => {
    const duration = performance.now() - startTime;
    metrics.current.navigationTimes.set(route, duration);
    
    if (duration > metrics.current.slowThreshold) {
      console.warn(`Slow navigation to ${route}: ${duration.toFixed(0)}ms`);
    }
    return duration;
  }, []);

  return { trackNavigation };
};
