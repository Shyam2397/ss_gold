import { useState, useEffect, useMemo, useRef } from 'react';

const useSparklineData = ({ tokens, expenseData, entries, exchanges }) => {
  const [sparklineData, setSparklineData] = useState({
    revenue: [],
    expenses: [],
    profit: [],
    customers: [],
    skinTests: [],
    weights: []
  });
  
  const workerRef = useRef(null);
  
  // Track if data has been sent to worker to avoid duplicate processing
  const dataSentRef = useRef(false);

  // Create a memoized worker instance
  const worker = useMemo(() => {
    // Reuse existing worker if available
    if (workerRef.current) {
      return workerRef.current;
    }
    
    // Create a new worker
    const newWorker = new Worker(
      new URL('../workers/sparklineProcessor.js', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current = newWorker;
    return newWorker;
  }, []);

  // Set up worker communication
  useEffect(() => {
    if (!worker || dataSentRef.current) return;
    
    // Handle messages from the worker
    const handleWorkerMessage = (event) => {
      if (event.data.error) {
        console.error('Worker error:', event.data.error);
        return;
      }
      
      // Handle progress updates
      if (event.data.progress !== undefined) {
        // Could update a progress indicator here
        return;
      }
      
      // Update state with calculated sparkline data
      setSparklineData(event.data);
      dataSentRef.current = false; // Reset for next update
    };
    
    // Handle worker errors
    const handleWorkerError = (error) => {
      console.error('Worker error:', error);
      dataSentRef.current = false; // Reset for next update
    };
    
    // Add event listeners
    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', handleWorkerError);
    
    // Debounce data processing to avoid excessive computations
    const timeoutId = setTimeout(() => {
      worker.postMessage({ tokens, expenseData, entries, exchanges });
      dataSentRef.current = true;
    }, 150);
    
    // Clean up worker when component unmounts
    return () => {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', handleWorkerMessage);
      worker.removeEventListener('error', handleWorkerError);
      // Don't terminate the worker to allow reuse
    };
  }, [worker, tokens, expenseData, entries, exchanges]);

  return sparklineData;
};

export default useSparklineData;