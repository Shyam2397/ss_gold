import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRender = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRender.current;
    
    // Log performance metrics
    console.log(`${componentName} Performance Metrics:`, {
      renderCount: renderCount.current,
      timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
      timestamp: new Date().toISOString(),
    });

    // Mark and measure for Performance Timeline API
    performance.mark(`${componentName}-render-start`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-render-start`
    );

    lastRender.current = now;

    return () => {
      performance.clearMarks(`${componentName}-render-start`);
      performance.clearMeasures(`${componentName}-render`);
    };
  });

  return renderCount.current;
};
