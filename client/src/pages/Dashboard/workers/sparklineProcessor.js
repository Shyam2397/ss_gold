/* eslint-disable no-restricted-globals */

// Cache for date operations
const dateCache = new Map();

// Helper function to parse dates with caching
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

// Process items in batches to avoid blocking
const processBatch = (items, processorFn, batchSize = 100) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...processorFn(batch));
    // Allow other operations to run
    if (i % (batchSize * 5) === 0) {
      self.postMessage({ progress: (i / items.length) * 100 });
    }
  }
  return results;
};

// Optimized daily total calculation using maps for better performance
const getDailyTotalOptimized = (items, dateField, valueField = 'totalAmount') => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return date;
  });

  // Create a map of dates for faster lookup
  const dateMap = new Map();
  days.forEach(day => {
    dateMap.set(day.toDateString(), { date: day, value: 0 });
  });

  // Process items in batches
  processBatch(items, (batch) => {
    batch.forEach(item => {
      // Check if item has the required date field before processing
      if (!item[dateField]) return;
      
      const itemDate = parseDate(item[dateField]);
      if (isNaN(itemDate.getTime())) return; // Skip invalid dates
      
      const dateKey = itemDate.toDateString();
      if (dateMap.has(dateKey)) {
        const entry = dateMap.get(dateKey);
        // Handle both string field names and function value fields
        const value = typeof valueField === 'function' 
          ? valueField(item)
          : parseFloat(item[valueField]) || 0;
        entry.value += value;
      }
    });
    return [];
  });

  // Convert map to array
  return Array.from(dateMap.values()).map(entry => ({
    date: entry.date.toISOString(),
    value: entry.value
  }));
};

// Process sparkline data for dashboard metrics
const processSparklineData = ({ tokens, expenseData, entries, exchanges }) => {
  try {
    // Revenue sparkline data
    const revenue = getDailyTotalOptimized(tokens, 'date');

    // Expenses sparkline data
    const expenses = getDailyTotalOptimized(expenseData, 'date', 'amount');

    // Profit sparkline data
    const profit = revenue.map((rev, index) => ({
      date: rev.date,
      value: rev.value - expenses[index].value
    }));

    // Customers sparkline data
    const customers = getDailyTotalOptimized(entries, 'createdAt', () => 1);

    // Skin tests sparkline data
    const skinTestTokens = tokens.filter(token => token.test === "Skin Testing");
    const skinTests = getDailyTotalOptimized(skinTestTokens, 'date', () => 1);

    // Weights sparkline data
    const weights = getDailyTotalOptimized(exchanges, 'date', 'weight');

    return {
      revenue,
      expenses,
      profit,
      customers,
      skinTests,
      weights
    };
  } catch (error) {
    return { error: error.message };
  }
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const result = processSparklineData(event.data);
  self.postMessage(result);
});