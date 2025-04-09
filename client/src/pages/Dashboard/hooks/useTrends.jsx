import { useState, useEffect, useMemo } from 'react';

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
  
  // Create a memoized worker instance
  const worker = useMemo(() => {
    // Create a new worker
    const newWorker = new Worker(
      new URL('../workers/trendsProcessor.js', import.meta.url),
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
      
      // Update state with calculated trends
      setTrends(event.data);
    };
    
    // Add event listener
    worker.addEventListener('message', handleWorkerMessage);
    
    // Send data to worker for processing
    worker.postMessage({ tokens, expenses, entries, exchanges });
    
    // Clean up worker when component unmounts
    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.terminate();
    };
  }, [worker, tokens, expenses, entries, exchanges]);
  
  return trends;
}

export default useTrends;