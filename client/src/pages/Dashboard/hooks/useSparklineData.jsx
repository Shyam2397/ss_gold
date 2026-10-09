import { useState, useEffect } from 'react';
import { parseDate } from '../utils/dateUtils';

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
          if (!item || !item[dateField]) return false;
          const itemDate = parseDate(item[dateField]);
          return !isNaN(itemDate.getTime()) && itemDate.toDateString() === day.toDateString();
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
      const value = (entries || []).filter(entry => {
        if (!entry) return false;
        const entryDate = parseDate(entry.created_at || entry.date);
        return !isNaN(entryDate.getTime()) && entryDate.toDateString() === day.toDateString();
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
        const tokenDate = parseDate(token.date);
        return !isNaN(tokenDate.getTime()) && tokenDate.toDateString() === day.toDateString();
      }).length;

      return {
        date: day.toISOString(),
        value
      };
    });

    // Exchanges sparkline data (daily count of exchanges)
    const dailyExchanges = days.map(day => {
      const value = (exchanges || []).filter(exchange => {
        if (!exchange) return false;
        const exchangeDate = parseDate(exchange.date);
        return !isNaN(exchangeDate.getTime()) && exchangeDate.toDateString() === day.toDateString();
      }).length;

      return {
        date: day.toISOString(),
        value
      };
    });

    // Weights sparkline data
    const weights = days.map(day => {
      const value = (exchanges || [])
        .filter(exchange => {
          if (!exchange) return false;
          const exchangeDate = parseDate(exchange.date);
          return !isNaN(exchangeDate.getTime()) && exchangeDate.toDateString() === day.toDateString();
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
      exchanges: dailyExchanges,
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
      exchanges: [],
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
    exchanges: [],
    weights: []
  });

  // A worker is created per data change and terminated once it answers (or the
  // effect cleans up). This keeps it StrictMode-safe and leak-free.
  useEffect(() => {
    let isMounted = true;
    let worker = null;
    let timeoutId = null;
    let settled = false;

    const data = { tokens, expenseData, entries, exchanges };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (isMounted) setSparklineData(result);
    };

    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      finish(calculateSparklineDataFallback(data));
      return () => { isMounted = false; };
    }

    try {
      worker = new Worker(
        new URL('../workers/sparklineProcessor.js', import.meta.url),
        { type: 'module' }
      );

      worker.addEventListener('message', (event) => {
        finish(event.data?.error ? calculateSparklineDataFallback(data) : event.data);
      });

      worker.addEventListener('error', () => {
        finish(calculateSparklineDataFallback(data));
      });

      // Timeout in case the worker never responds.
      timeoutId = setTimeout(() => {
        finish(calculateSparklineDataFallback(data));
      }, 2000);

      worker.postMessage(data);
    } catch (err) {
      console.warn('Web Worker initialization failed, using fallback', err);
      finish(calculateSparklineDataFallback(data));
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };
  }, [tokens, expenseData, entries, exchanges]);

  return sparklineData;
};

export default useSparklineData;