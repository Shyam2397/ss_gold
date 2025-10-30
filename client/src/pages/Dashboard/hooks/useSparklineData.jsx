import { useState, useEffect, useMemo, useCallback } from 'react';

// Fallback function to calculate sparkline data on the main thread if Web Worker fails
const calculateSparklineDataFallback = ({ tokens = [], expenseData = [], entries = [], exchanges = [] }) => {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - i));
    return date;
  });

  // Helper function to get daily total
  const getDailyTotal = (items, dateField, valueField = 'totalAmount') => {
    return days.map(day => {
      const dayValue = items
        .filter(item => {
          if (!item) return false;
          const itemDate = new Date(item[dateField]);
          return itemDate.toDateString() === day.toDateString();
        })
        .reduce((sum, item) => sum + (parseFloat(item[valueField]) || 0), 0);
        
      return {
        date: day.toISOString(),
        value: dayValue
      };
    });
  };

  try {
    // Revenue sparkline data
    const revenue = getDailyTotal(tokens, 'date');

    // Expenses sparkline data
    const expenses = getDailyTotal(expenseData, 'date', 'amount');

    // Profit sparkline data
    const profit = days.map((day, index) => ({
      date: day.toISOString(),
      value: (revenue[index]?.value || 0) - (expenses[index]?.value || 0)
    }));

    // Customers sparkline data
    const customers = days.map(day => {
      const value = entries.filter(entry => {
        if (!entry) return false;
        const entryDate = new Date(entry.createdAt || entry.date);
        return entryDate.toDateString() === day.toDateString();
      }).length;
      
      return {
        date: day.toISOString(),
        value
      };
    });

    // Tokens sparkline data (daily total tokens)
    const dailyTokens = days.map(day => {
      const value = (tokens || []).filter(token => {
        if (!token) return false;
        const tokenDate = new Date(token.date);
        return tokenDate.toDateString() === day.toDateString();
      }).length;
      
      return {
        date: day.toISOString(),
        value
      };
    });

    // Skin tests sparkline data
    const skinTests = days.map(day => {
      const value = tokens.filter(token => {
        if (!token) return false;
        const tokenDate = new Date(token.date);
        return tokenDate.toDateString() === day.toDateString() && token.testType === 'skin';
      }).length;
      
      return {
        date: day.toISOString(),
        value
      };
    });

    // Weights sparkline data
    const weights = days.map(day => {
      const value = exchanges
        .filter(exchange => {
          if (!exchange) return false;
          const exchangeDate = new Date(exchange.date);
          return exchangeDate.toDateString() === day.toDateString();
        })
        .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);
      
      return {
        date: day.toISOString(),
        value
      };
    });

    return {
      revenue,
      expenses,
      profit,
      customers,
      tokens: dailyTokens,
      skinTests,
      weights
    };
  } catch (error) {
    // Return empty data structure on error
    return {
      revenue: [],
      expenses: [],
      profit: [],
      customers: [],
      tokens: [],
      skinTests: [],
      weights: []
    };
  }
};

const useSparklineData = ({ tokens = [], expenseData = [], entries = [], exchanges = [] }) => {
  const [sparklineData, setSparklineData] = useState({
    revenue: [],
    expenses: [],
    profit: [],
    customers: [],
    tokens: [],
    skinTests: [],
    weights: []
  });
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Create a memoized worker instance
  const worker = useMemo(() => {
    try {
      // Create worker in a way that works with webpack/vite
      const newWorker = new Worker(
        new URL('../workers/sparklineProcessor.js', import.meta.url),
        { type: 'module' }
      );
      
      setUsingFallback(false);
      return newWorker;
    } catch (err) {
      setUsingFallback(true);
      return null;
    }
  }, []);

  // Function to process data using Web Worker
  const processWithWorker = useCallback((data) => {
    if (!worker) {
      setUsingFallback(true);
      return Promise.resolve(calculateSparklineDataFallback(data));
    }

    return new Promise((resolve) => {
      let timeoutId;
      
      const handleWorkerResponse = (event) => {
        // Clean up the timeout and event listener
        clearTimeout(timeoutId);
        worker.removeEventListener('message', handleWorkerResponse);
        
        if (event.data.error) {
          setError(event.data.error);
          resolve(calculateSparklineDataFallback(data));
          return;
        }
        
        resolve(event.data);
      };
      
      // Set up the worker message listener
      worker.addEventListener('message', handleWorkerResponse);
      
      // Set a timeout to handle cases where the worker doesn't respond
      timeoutId = setTimeout(() => {
        worker.removeEventListener('message', handleWorkerResponse);
        setUsingFallback(true);
        resolve(calculateSparklineDataFallback(data));
      }, 2000); // 2 second timeout
      
      // Send data to worker for processing
      try {
        worker.postMessage(data);
      } catch (error) {
        clearTimeout(timeoutId);
        worker.removeEventListener('message', handleWorkerResponse);
        setUsingFallback(true);
        resolve(calculateSparklineDataFallback(data));
      }
    });
  }, [worker]);

  // Process data when dependencies change
  useEffect(() => {
    let isMounted = true;
    
    const processData = async () => {
      try {
        const data = { tokens, expenseData, entries, exchanges };
        
        const result = await processWithWorker(data);
        
        if (isMounted) {
          setSparklineData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          // Try fallback on error
          setSparklineData(calculateSparklineDataFallback({ tokens, expenseData, entries, exchanges }));
        }
      }
    };
    
    processData();
    
    return () => {
      isMounted = false;
    };
  }, [tokens, expenseData, entries, exchanges, usingFallback, processWithWorker]);

  // Log any errors
  useEffect(() => {
    if (error) {
      console.error('Sparkline data error:', error);
    }
  }, [error]);

  return sparklineData;
};

export default useSparklineData;