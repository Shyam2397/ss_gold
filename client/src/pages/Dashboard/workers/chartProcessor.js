/* eslint-disable no-restricted-globals */

// Cache for date operations
const dateCache = new Map();

const parseDate = (dateStr) => {
  // Check if dateStr is a valid string before processing
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(NaN);
  }
  
  if (!dateCache.has(dateStr)) {
    // Handle different date formats more efficiently
    let date;
    if (dateStr.includes && dateStr.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = dateStr.split('/');
      date = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format
      date = new Date(dateStr);
    }
    dateCache.set(dateStr, date);
  }
  return dateCache.get(dateStr);
};

// Batch process data to reduce memory usage
const batchProcess = (items, batchSize = 1000) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...batch);
    // Allow other operations to run
    if (i % (batchSize * 10) === 0) {
      self.postMessage({ progress: (i / items.length) * 100 });
    }
  }
  return results;
};

const processChartData = ({ tokens, expenses, entries, exchanges }) => {
  try {
    const processedData = {
      revenue: new Map(),
      expenses: new Map(),
      customers: new Map(),
      exchanges: new Map(),
      weights: new Map()
    };

    // Process tokens in batches
    batchProcess(tokens).forEach(token => {
      // Check if token has required properties
      if (!token.date) return;
      
      const date = parseDate(token.date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const dateKey = date.toISOString().split('T')[0];
      
      if (!processedData.revenue.has(dateKey)) {
        processedData.revenue.set(dateKey, 0);
      }
      processedData.revenue.set(
        dateKey, 
        processedData.revenue.get(dateKey) + (parseFloat(token.totalAmount) || 0)
      );
    });

    // Process expenses in batches
    batchProcess(expenses).forEach(expense => {
      // Check if expense has required properties
      if (!expense.date) return;
      
      const date = new Date(expense.date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const dateKey = date.toISOString().split('T')[0];
      
      if (!processedData.expenses.has(dateKey)) {
        processedData.expenses.set(dateKey, 0);
      }
      processedData.expenses.set(
        dateKey, 
        processedData.expenses.get(dateKey) + (parseFloat(expense.amount) || 0)
      );
    });

    // Process exchanges in batches
    batchProcess(exchanges).forEach(exchange => {
      // Check if exchange has required properties
      if (!exchange.date) return;
      
      const date = parseDate(exchange.date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const dateKey = date.toISOString().split('T')[0];
      
      if (!processedData.exchanges.has(dateKey)) {
        processedData.exchanges.set(dateKey, 0);
      }
      processedData.exchanges.set(
        dateKey, 
        processedData.exchanges.get(dateKey) + 1
      );
      
      // Process weights
      if (!processedData.weights.has(dateKey)) {
        processedData.weights.set(dateKey, 0);
      }
      processedData.weights.set(
        dateKey, 
        processedData.weights.get(dateKey) + (parseFloat(exchange.weight) || 0)
      );
    });

    // Process entries in batches
    batchProcess(entries).forEach(entry => {
      // Check if entry has required properties
      if (!entry.createdAt && !entry.date) return;
      
      const date = new Date(entry.createdAt || entry.date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const dateKey = date.toISOString().split('T')[0];
      
      if (!processedData.customers.has(dateKey)) {
        processedData.customers.set(dateKey, 0);
      }
      processedData.customers.set(
        dateKey, 
        processedData.customers.get(dateKey) + 1
      );
    });

    // Convert Maps to arrays and sort by date
    const result = {
      revenue: Array.from(processedData.revenue, ([date, value]) => ({ date, value })),
      expenses: Array.from(processedData.expenses, ([date, value]) => ({ date, value })),
      customers: Array.from(processedData.customers, ([date, value]) => ({ date, value })),
      exchanges: Array.from(processedData.exchanges, ([date, value]) => ({ date, value })),
      weights: Array.from(processedData.weights, ([date, value]) => ({ date, value }))
    };

    // Sort all arrays by date
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return result;
  } catch (error) {
    return { error: error.message };
  }
};

self.addEventListener('message', (event) => {
  const result = processChartData(event.data);
  self.postMessage(result);
});