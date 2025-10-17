import { useEffect, useRef } from 'react';

const usePerformanceMonitor = (componentName) => {
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    const startTime = performance.now();
    renderCountRef.current += 1;
    
    // Log render count for debugging
    console.log(`${componentName} render count:`, renderCountRef.current);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      console.log(`${componentName} render time:`, duration.toFixed(2), 'ms');
      
      // Report to monitoring service if duration exceeds threshold
      if (duration > 200) {
        console.warn(`${componentName} took longer than expected to render:`, duration.toFixed(2), 'ms');
      }
      
      // Log performance to analytics service (in a real app)
      // analytics.track('component_render_time', {
      //   componentName,
      //   duration,
      //   renderCount: renderCountRef.current
      // });
    };
  });
};

export default usePerformanceMonitor;
