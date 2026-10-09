import { useEffect, useRef } from 'react';

// Lightweight, dev-only mount timing. Avoids per-render work and the previous
// module-level Map that grew without bound.
const usePerformanceMonitor = (componentName) => {
  const mountTime = useRef(0);

  useEffect(() => {
    mountTime.current = performance.now();

    return () => {
      const duration = performance.now() - mountTime.current;
      if (import.meta.env?.DEV && duration > 200) {
        console.warn(`${componentName} was mounted for ${duration.toFixed(0)}ms`);
      }
    };
  }, [componentName]);
};

export const getPerformanceData = () => [];
export const clearPerformanceData = () => {};

export default usePerformanceMonitor;
