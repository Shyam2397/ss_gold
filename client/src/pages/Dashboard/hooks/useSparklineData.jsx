import { useState, useEffect, useMemo } from 'react';

const useSparklineData = ({ tokens, expenseData, entries, exchanges }) => {
  const [sparklineData, setSparklineData] = useState({
    revenue: [],
    expenses: [],
    profit: [],
    customers: [],
    skinTests: [],
    weights: []
  });

  // Create a memoized worker instance
  const worker = useMemo(() => {
    // Create a new worker
    const newWorker = new Worker(
      new URL('../workers/sparklineProcessor.js', import.meta.url),
      { type: 'module' }
    );
    
    return newWorker;
  }, []);

  // Set up worker communication
  useEffect(() => {
    if (!worker) return;
    
    // Handle messages from the worker
    const handleWorkerMessage = (event) => {
      if (event.data.error) {
        console.error('Worker error:', event.data.error);
        return;
      }
      
      // Update state with calculated sparkline data
      setSparklineData(event.data);
    };
    
    // Add event listener
    worker.addEventListener('message', handleWorkerMessage);
    
    // Send data to worker for processing
    worker.postMessage({ tokens, expenseData, entries, exchanges });
    
    // Clean up worker when component unmounts
    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.terminate();
    };
  }, [worker, tokens, expenseData, entries, exchanges]);

  return sparklineData;
};

export default useSparklineData;