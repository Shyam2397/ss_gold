const MAX_CACHE_SIZE = 100;
const dateCache = new Map();

// Optimized date parser with caching
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr);
  }

  // Clean cache if needed
  if (dateCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }
  
  let date;
  
  // Try different date formats
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    date = new Date(y, m - 1, d);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) { // ISO format
      date = new Date(dateStr);
    } else { // DD-MM-YYYY format
      const [d, m, y] = parts;
      date = new Date(y, m - 1, d);
    }
  } else {
    date = new Date(dateStr);
  }
  
  // Fallback to current date if invalid
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  
  dateCache.set(dateStr, date);
  return date;
};

// Process sparkline data for dashboard metrics
const processSparklineData = ({ tokens = [], expenseData = [], entries = [], exchanges = [] }) => {
  // Clear cache if it's getting too big
  if (dateCache.size > MAX_CACHE_SIZE * 2) {
    dateCache.clear();
  }
  try {
    const today = new Date();
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - i));
      return date;
    });

    // Optimized helper function to get daily total
    const getDailyTotal = (items, dateField, valueField = 'totalAmount') => {
      const dayMap = new Map();
      
      // Initialize day map with all days set to 0
      days.forEach(day => {
        dayMap.set(day.toDateString(), 0);
      });
      
      // Process items once
      items.forEach(item => {
        if (!item || !item[dateField]) return;
        
        try {
          const itemDate = parseDate(item[dateField]);
          const dayKey = itemDate.toDateString();
          
          if (dayMap.has(dayKey)) {
            const value = parseFloat(item[valueField]) || 0;
            dayMap.set(dayKey, dayMap.get(dayKey) + value);
          }
        } catch (e) {
          console.warn('Error processing item:', e);
        }
      });
      
      // Convert to array of objects
      return days.map(day => ({
        date: day.toISOString(),
        value: dayMap.get(day.toDateString()) || 0
      }));
    };

    // Revenue sparkline data
    const revenue = getDailyTotal(tokens, 'date');

    // Expenses sparkline data
    const expenses = getDailyTotal(expenseData, 'date', 'amount');

    // Profit sparkline data with minimum height for visibility
    const profit = days.map((day, index) => {
      const profitValue = revenue[index].value - expenses[index].value;
      // Ensure profit is at least 10% of revenue (but not more than the actual profit)
      // This makes sure the line is visible even when profit is very small
      const minVisibleValue = revenue[index].value * 0.1;
      const displayValue = profitValue > 0 && profitValue < minVisibleValue ? minVisibleValue : profitValue;
      
      return {
        date: day.toISOString(),
        value: displayValue
      };
    });

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
      const dayStr = day.toISOString().split('T')[0];
      
      const dayExchanges = (exchanges || []).filter(exchange => {
        if (!exchange || !exchange.date) return false;
        try {
          const exchangeDate = parseDate(exchange.date);
          const exchangeDateStr = exchangeDate.toISOString().split('T')[0];
          return exchangeDateStr === dayStr;
        } catch (e) {
          // Error parsing date
          return false;
        }
      });

      const value = dayExchanges.reduce((sum, exchange) => {
        const weight = parseFloat(exchange.weight || '0');
        return isNaN(weight) ? sum : sum + weight;
      }, 0);

      
      return {
        date: day.toISOString(),
        value: value || 0 // Ensure we always return a number
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