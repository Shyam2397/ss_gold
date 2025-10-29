/* eslint-disable no-restricted-globals */

// Cache for date operations
const dateCache = new Map();
const MAX_CACHE_SIZE = 100;

// Helper function to parse dates with caching and multiple format support
const parseDate = (dateStr) => {
  if (!dateStr) return new Date(); // Return current date if dateStr is falsy
  
  if (!dateCache.has(dateStr)) {
    // Implement cache size limit
    if (dateCache.size >= MAX_CACHE_SIZE) {
      const firstKey = dateCache.keys().next().value;
      dateCache.delete(firstKey);
    }
    
    let parsedDate;
    
    // Try parsing as ISO date first
    parsedDate = new Date(dateStr);
    
    // If invalid, try DD/MM/YYYY format
    if (isNaN(parsedDate.getTime())) {
      const slashParts = dateStr.split('/');
      if (slashParts.length === 3) {
        // DD/MM/YYYY format
        const [day, month, year] = slashParts;
        parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
      }
    }
    
    // If still invalid, try DD-MM-YYYY format
    if (isNaN(parsedDate.getTime())) {
      const dashParts = dateStr.split('-');
      if (dashParts.length === 3) {
        // Try DD-MM-YYYY format
        const [day, month, year] = dashParts;
        parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
      }
    }
    
    // If still invalid, try MM/DD/YYYY format
    if (isNaN(parsedDate.getTime())) {
      const slashParts = dateStr.split('/');
      if (slashParts.length === 3) {
        // MM/DD/YYYY format
        const [month, day, year] = slashParts;
        parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
      }
    }
    
    // If still invalid, use current date as fallback
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }
    
    dateCache.set(dateStr, parsedDate);
  }
  return dateCache.get(dateStr);
};

// Process sparkline data for dashboard metrics
const processSparklineData = ({ tokens = [], expenseData = [], entries = [], exchanges = [] }) => {
  try {
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
            const itemDate = parseDate(item[dateField]);
            return itemDate.toDateString() === day.toDateString();
          })
          .reduce((sum, item) => sum + (parseFloat(item[valueField]) || 0), 0);
          
        return {
          date: day.toISOString(),
          value: dayValue
        };
      });
    };

    // Revenue sparkline data
    const revenue = getDailyTotal(tokens, 'date');

    // Expenses sparkline data
    const expenses = getDailyTotal(expenseData, 'date', 'amount');

    // Profit sparkline data
    const profit = days.map((day, index) => ({
      date: day.toISOString(),
      value: revenue[index].value - expenses[index].value
    }));

    // Tokens sparkline data (daily total tokens)
    const dailyTokens = days.map(day => {
      const value = (tokens || []).filter(token => {
        const tokenDate = parseDate(token.date);
        return tokenDate.toDateString() === day.toDateString();
      }).length;
      
      return {
        date: day.toISOString(),
        value
      };
    });

    // Exchanges sparkline data (daily count of exchanges)
    const dailyExchanges = days.map(day => {
      const value = (exchanges || []).filter(exchange => {
        const exchangeDate = parseDate(exchange.date);
        return exchangeDate.toDateString() === day.toDateString();
      }).length;
      
      return {
        date: day.toISOString(),
        value
      };
    });

    // Weights sparkline data (for Pure Exchange metric)
    const weights = days.map(day => {
      const value = (exchanges || [])
        .filter(exchange => {
          const exchangeDate = parseDate(exchange.date);
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
      tokens: dailyTokens,
      exchanges: dailyExchanges,
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