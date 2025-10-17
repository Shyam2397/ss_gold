import { useState, useEffect, useMemo, useRef } from 'react';

function useTrends({ tokens, expenses, entries, exchanges }) {
  const [trends, setTrends] = useState({
    revenueGrowth: 0,
    expensesGrowth: 0,
    profitGrowth: 0,
    marginGrowth: 0,
    customersTrend: 0,
    tokensTrend: 0,
    exchangesTrend: 0,
    weightTrend: 0,
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
      new URL('../workers/trendsProcessor.js', import.meta.url),
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
      
      // Update state with calculated trends
      setTrends(event.data);
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
      worker.postMessage({ tokens, expenses, entries, exchanges });
      dataSentRef.current = true;
    }, 100);
    
    // Clean up worker when component unmounts
    return () => {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', handleWorkerMessage);
      worker.removeEventListener('error', handleWorkerError);
      // Don't terminate the worker to allow reuse
    };
  }, [worker, tokens, expenses, entries, exchanges]);
  
  return trends;
}

export default useTrends;