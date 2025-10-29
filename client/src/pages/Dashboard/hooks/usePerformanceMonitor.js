import { useEffect, useRef } from 'react';

// Performance monitoring data storage
const performanceData = new Map();
let monitoringId = 0;

const usePerformanceMonitor = (componentName) => {
  const mountTime = useRef(performance.now());
  const renderCount = useRef(0);
  const renderTimes = useRef([]);
  const id = useRef(++monitoringId);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      renderTimes.current.push(duration);
      
      // Calculate average render time
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      // Log performance metrics
      //console.log(`${componentName} render time:`, duration.toFixed(2), 'ms');
      //console.log(`${componentName} average render time:`, avgRenderTime.toFixed(2), 'ms');
      //console.log(`${componentName} render count:`, renderCount.current);
      
      // Report to monitoring service if duration exceeds threshold
      if (duration > 200) {
        //console.warn(`${componentName} took longer than expected to render:`, duration.toFixed(2), 'ms');
      }
      
      // Store performance data for analysis
      performanceData.set(id.current, {
        componentName,
        renderTime: duration,
        avgRenderTime,
        renderCount: renderCount.current,
        timestamp: new Date().toISOString()
      });
    };
  });

  // Track render count
  useEffect(() => {
    renderCount.current++;
  });

  // Component mount time tracking
  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current;
    //console.log(`${componentName} mounted in:`, mountDuration.toFixed(2), 'ms');
  }, [componentName]);
};

// Function to get performance data
export const getPerformanceData = () => {
  return Array.from(performanceData.values());
};

// Function to clear performance data
export const clearPerformanceData = () => {
  performanceData.clear();
};

export default usePerformanceMonitor;