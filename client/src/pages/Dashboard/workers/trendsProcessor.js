/* eslint-disable no-restricted-globals */

// Cache for date parsing to improve performance
const dateCache = new Map();

// Helper function to parse dates with caching and support for multiple formats
const parseDate = (dateStr) => {
  // Return early if already cached
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr);
  }
  
  let parsedDate;
  
  try {
    // Handle different date formats
    if (typeof dateStr === 'string') {
      if (dateStr.includes('-')) {
        // Check if it's already in ISO format (YYYY-MM-DD)
        const isoParts = dateStr.split('-');
        if (isoParts.length === 3 && isoParts[0].length === 4) {
          // Already in correct format (YYYY-MM-DD)
          parsedDate = new Date(dateStr);
        } else {
          // Assuming format is DD-MM-YYYY
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            // Convert DD-MM-YYYY to MM-DD-YYYY for proper Date parsing
            parsedDate = new Date(`${parts[1]}-${parts[0]}-${parts[2]}`);
          } else {
            // Fallback for other formats
            parsedDate = new Date(dateStr);
          }
        }
      } else if (dateStr.includes('/')) {
        // Handle DD/MM/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Convert DD/MM/YYYY to MM/DD/YYYY for proper Date parsing
          parsedDate = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
        } else {
          // Fallback for other formats
          parsedDate = new Date(dateStr);
        }
      } else {
        // Handle other formats
        parsedDate = new Date(dateStr);
      }
    } else {
      // Handle non-string dates
      parsedDate = new Date(dateStr);
    }
    
    // Validate date
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (e) {
    // Fallback to current date if parsing fails
    parsedDate = new Date();
  }
  
  // Cache the result
  dateCache.set(dateStr, parsedDate);
  return parsedDate;
};

// Helper function to calculate percentage change
const calculateTrend = (current, previous) => {
  // Handle edge cases
  if (isNaN(current) || isNaN(previous)) {
    return 0;
  }
  
  // If both are zero, no trend
  if (current === 0 && previous === 0) {
    return 0;
  }
  
  // If previous is zero but current is not, return 100% growth
  if (previous === 0 && current > 0) {
    return 100;
  }
  
  // If previous is zero and current is negative, return -100% decline
  if (previous === 0 && current < 0) {
    return -100;
  }
  
  const trend = ((current - previous) / previous * 100);
  const result = parseFloat(trend.toFixed(2)) || 0;
  return result;
};

// Process data in batches for better performance
const batchProcess = (items, dateField, processFn, thirtyDaysAgo, sixtyDaysAgo, today) => {
  if (!items || items.length === 0) {
    return { current: 0, previous: 0 };
  }
  
  const result = items.reduce((acc, item) => {
    const date = parseDate(item[dateField]);
    if (date >= thirtyDaysAgo && date <= today) {
      acc.current += processFn(item);
    } else if (date >= sixtyDaysAgo && date < thirtyDaysAgo) {
      acc.previous += processFn(item);
    }
    return acc;
  }, { current: 0, previous: 0 });
  
  return result;
};

// Main function to calculate trends
const calculateTrends = ({ tokens, expenses, entries, exchanges }) => {
  try {
    // Get dates for last 30 days and previous 30 days (as per project specification)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    // Revenue trend
    const revenue = batchProcess(
      tokens || [], 
      'date', 
      token => parseFloat(token.totalAmount) || 0,
      thirtyDaysAgo,
      sixtyDaysAgo,
      today
    );
    
    const revenueGrowth = calculateTrend(revenue.current, revenue.previous);

    // Expenses trend
    const expenseData = batchProcess(
      expenses || [], 
      'date', 
      expense => parseFloat(expense.amount) || 0,
      thirtyDaysAgo,
      sixtyDaysAgo,
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

    // Token trend
    const currentTokens = (tokens || []).filter(token => {
      const tokenDate = parseDate(token.date);
      return tokenDate >= thirtyDaysAgo && tokenDate <= today;
    }).length;

    const previousTokens = (tokens || []).filter(token => {
      const tokenDate = parseDate(token.date);
      return tokenDate >= sixtyDaysAgo && tokenDate < thirtyDaysAgo;
    }).length;

    const tokensTrend = calculateTrend(currentTokens, previousTokens);

    // Exchange trend
    const currentExchanges = (exchanges || []).filter(exchange => {
      const exchangeDate = parseDate(exchange.date);
      return exchangeDate >= thirtyDaysAgo && exchangeDate <= today;
    }).length;

    const previousExchanges = (exchanges || []).filter(exchange => {
      const exchangeDate = parseDate(exchange.date);
      return exchangeDate >= sixtyDaysAgo && exchangeDate < thirtyDaysAgo;
    }).length;

    const exchangesTrend = calculateTrend(currentExchanges, previousExchanges);

    // Weight trend
    const currentWeight = (exchanges || [])
      .filter(exchange => {
        const exchangeDate = parseDate(exchange.date);
        return exchangeDate >= thirtyDaysAgo && exchangeDate <= today;
      })
      .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

    const previousWeight = (exchanges || [])
      .filter(exchange => {
        const exchangeDate = parseDate(exchange.date);
        return exchangeDate >= sixtyDaysAgo && exchangeDate < thirtyDaysAgo;
      })
      .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

    const weightTrend = calculateTrend(currentWeight, previousWeight);

    const result = {
      revenueGrowth: parseFloat(revenueGrowth) || 0,
      expensesGrowth: parseFloat(expensesGrowth) || 0,
      profitGrowth: parseFloat(profitGrowth) || 0,
      marginGrowth: parseFloat(marginGrowth) || 0,
      tokensTrend: parseFloat(tokensTrend) || 0,
      exchangesTrend: parseFloat(exchangesTrend) || 0,
      weightTrend: parseFloat(weightTrend) || 0,
    };
    
    return result;
  } catch (error) {
    return { 
      revenueGrowth: 0,
      expensesGrowth: 0,
      profitGrowth: 0,
      marginGrowth: 0,
      tokensTrend: 0,
      exchangesTrend: 0,
      weightTrend: 0,
      error: error.message 
    };
  }
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const result = calculateTrends(event.data);
  self.postMessage(result);
});