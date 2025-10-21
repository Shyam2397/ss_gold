import { useEffect } from 'react';

const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      console.log(`${componentName} render time:`, duration.toFixed(2), 'ms');
      
      // Report to monitoring service if duration exceeds threshold
      if (duration > 200) {
        console.warn(`${componentName} took longer than expected to render:`, duration.toFixed(2), 'ms');
      }
    };
  });
};

export default usePerformanceMonitor;
