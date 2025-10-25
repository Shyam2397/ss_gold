/* eslint-disable no-restricted-globals */

// Cache for date operations with size limit
const MAX_CACHE_SIZE = 500;
const dateCache = new Map();

// Accumulate data chunks
const dataChunks = {
  tokens: [],
  expenses: [],
  entries: [],
  exchanges: []
};

const parseDate = (dateStr) => {
  if (!dateCache.has(dateStr)) {
    // Implement cache size limit to prevent memory leaks
    if (dateCache.size >= MAX_CACHE_SIZE) {
      const firstKey = dateCache.keys().next().value;
      dateCache.delete(firstKey);
    }
    dateCache.set(dateStr, new Date(dateStr.split('-').reverse().join('-')));
  }
  return dateCache.get(dateStr);
};

const processChartData = () => {
  try {
    const processedData = {
      revenue: new Map(),
      expenses: new Map(),
      customers: new Map(),
      exchanges: new Map(),
      weights: new Map()
    };

    // Process tokens
    (dataChunks.tokens || []).forEach(token => {
      const date = parseDate(token.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!processedData.revenue.has(dateKey)) {
        processedData.revenue.set(dateKey, 0);
      }
      processedData.revenue.set(
        dateKey, 
        processedData.revenue.get(dateKey) + (parseFloat(token.totalAmount) || 0)
      );
    });

    // Process expenses
    (dataChunks.expenses || []).forEach(expense => {
      const date = new Date(expense.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!processedData.expenses.has(dateKey)) {
        processedData.expenses.set(dateKey, 0);
      }
      processedData.expenses.set(
        dateKey, 
        processedData.expenses.get(dateKey) + (parseFloat(expense.amount) || 0)
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
      (result[key] || []).sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return result;
  } catch (error) {
    return { error: error.message };
  }
};

self.addEventListener('message', (event) => {
  const { type, dataType, data, isLastChunk } = event.data;
  
  if (type === 'chunk') {
    // Accumulate chunked data
    if (dataChunks[dataType]) {
      dataChunks[dataType].push(...(data || []));
    }
  } else if (type === 'process') {
    // Process accumulated data
    const result = processChartData();
    self.postMessage(result);
    
    // Clear accumulated data
    Object.keys(dataChunks).forEach(key => {
      dataChunks[key] = [];
    });
  }
});