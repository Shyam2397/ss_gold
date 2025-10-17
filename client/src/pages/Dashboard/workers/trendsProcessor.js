/* eslint-disable no-restricted-globals */

// Cache for date parsing to improve performance
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

// Helper function to calculate percentage change
const calculateTrend = (current, previous) => 
  previous ? ((current - previous) / previous * 100).toFixed(2) : 0;

// Process data in batches for better performance
const batchProcess = (items, dateField, processFn, sevenDaysAgo, fourteenDaysAgo, today) => {
  let current = 0;
  let previous = 0;
  
  // Process items in chunks to avoid blocking
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    for (const item of chunk) {
      // Check if item has the required date field before processing
      if (!item[dateField]) continue;
      
      const date = parseDate(item[dateField]);
      if (isNaN(date.getTime())) continue; // Skip invalid dates
      
      if (date >= sevenDaysAgo && date <= today) {
        current += processFn(item);
      } else if (date >= fourteenDaysAgo && date < sevenDaysAgo) {
        previous += processFn(item);
      }
    }
    
    // Allow other operations to run periodically
    if (i % 1000 === 0) {
      self.postMessage({ progress: (i / items.length) * 50 });
    }
  }
  
  return { current, previous };
};

// Optimized filter function that processes items in batches
const batchFilter = (items, filterFn, sevenDaysAgo, fourteenDaysAgo, today) => {
  let currentCount = 0;
  let previousCount = 0;
  let currentValue = 0;
  let previousValue = 0;
  
  // Process items in chunks
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    for (const item of chunk) {
      // Check if item has date property before processing
      if (!item.date) continue;
      
      const date = parseDate(item.date);
      if (isNaN(date.getTime())) continue; // Skip invalid dates
      
      if (date >= sevenDaysAgo && date <= today) {
        currentCount++;
        if (filterFn.value) {
          currentValue += parseFloat(item[filterFn.value] || '0');
        }
      } else if (date >= fourteenDaysAgo && date < sevenDaysAgo) {
        previousCount++;
        if (filterFn.value) {
          previousValue += parseFloat(item[filterFn.value] || '0');
        }
      }
    }
    
    // Allow other operations to run periodically
    if (i % 1000 === 0) {
      self.postMessage({ progress: 50 + (i / items.length) * 50 });
    }
  }
  
  return {
    currentCount,
    previousCount,
    currentValue,
    previousValue
  };
};

// Main function to calculate trends
const calculateTrends = ({ tokens, expenses, entries, exchanges }) => {
  try {
    // Get dates for last 7 days and previous 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Revenue trend
    const revenue = batchProcess(
      tokens, 
      'date', 
      token => parseFloat(token.totalAmount) || 0,
      sevenDaysAgo,
      fourteenDaysAgo,
      today
    );
    const revenueGrowth = calculateTrend(revenue.current, revenue.previous);

    // Expenses trend
    const expenseData = batchProcess(
      expenses, 
      'date', 
      expense => parseFloat(expense.amount) || 0,
      sevenDaysAgo,
      fourteenDaysAgo,
      today
    );
    const expensesGrowth = calculateTrend(expenseData.current, expenseData.previous);

    // Net Profit trend
    const currentProfit = revenue.current - expenseData.current;
    const previousProfit = revenue.previous - expenseData.previous;
    const profitGrowth = calculateTrend(currentProfit, previousProfit);

    // Profit Margin trend
    const currentMargin = revenue.current ? (currentProfit / revenue.current) * 100 : 0;
    const previousMargin = revenue.previous ? (previousProfit / revenue.previous) * 100 : 0;
    const marginGrowth = calculateTrend(currentMargin, previousMargin);

    // Customers trend (optimized)
    const customerData = batchFilter(
      entries,
      {},
      sevenDaysAgo,
      fourteenDaysAgo,
      today
    );
    const customersTrend = calculateTrend(customerData.currentCount, customerData.previousCount);

    // Token trend (optimized)
    const tokenData = batchFilter(
      tokens,
      {},
      sevenDaysAgo,
      fourteenDaysAgo,
      today
    );
    const tokensTrend = calculateTrend(tokenData.currentCount, tokenData.previousCount);

    // Exchange trend (optimized)
    const exchangeData = batchFilter(
      exchanges,
      {},
      sevenDaysAgo,
      fourteenDaysAgo,
      today
    );
    const exchangesTrend = calculateTrend(exchangeData.currentCount, exchangeData.previousCount);

    // Weight trend (optimized)
    const weightData = batchFilter(
      exchanges,
      { value: 'weight' },
      sevenDaysAgo,
      fourteenDaysAgo,
      today
    );
    const weightTrend = calculateTrend(weightData.currentValue, weightData.previousValue);

    return {
      revenueGrowth,
      expensesGrowth,
      profitGrowth,
      marginGrowth,
      customersTrend,
      tokensTrend,
      exchangesTrend,
      weightTrend,
    };
  } catch (error) {
    return { error: error.message };
  }
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const result = calculateTrends(event.data);
  self.postMessage(result);
});