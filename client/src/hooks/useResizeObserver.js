import { useEffect, useRef, useCallback } from 'react';

export const useResizeObserver = (onResize, debounceMs = 100) => {
  const elementRef = useRef(null);
  const resizeTimerRef = useRef(null);
  
  const debouncedCallback = useCallback(
    (entries) => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          onResize?.({ width, height, entry });
        }
      }, debounceMs);
    },
    [onResize, debounceMs]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !window.ResizeObserver) return;

    const observer = new ResizeObserver(debouncedCallback);
    observer.observe(element);

    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      observer.disconnect();
    };
  }, [debouncedCallback]);

  return elementRef;
};
