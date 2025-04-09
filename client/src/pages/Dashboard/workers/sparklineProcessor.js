/* eslint-disable no-restricted-globals */

// Cache for date operations
const dateCache = new Map();

// Helper function to parse dates with caching
const parseDate = (dateStr) => {
  if (!dateCache.has(dateStr)) {
    dateCache.set(dateStr, new Date(dateStr.split('-').reverse().join('-')));
  }
  return dateCache.get(dateStr);
};

// Process sparkline data for dashboard metrics
const processSparklineData = ({ tokens, expenseData, entries, exchanges }) => {
  try {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
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

    // Customers sparkline data
    const customers = days.map(day => {
      const value = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.toDateString() === day.toDateString();
      }).length;
      
      return {
        date: day.toISOString(),
        value
      };
    });

    // Skin tests sparkline data
    const skinTests = days.map(day => {
      const value = tokens.filter(token => {
        const tokenDate = parseDate(token.date);
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