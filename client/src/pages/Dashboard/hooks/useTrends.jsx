import { useState, useEffect } from 'react';

// Fallback function to calculate trends on the main thread
const calculateTrendsFallback = ({ tokens, expenses, entries, exchanges }) => {
  try {
    // Get dates for last 30 days and previous 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    // Helper function to parse dates
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date();
      
      try {
        // Handle ISO date strings with time (e.g., "2025-10-29T18:30:00.000Z")
        if (typeof dateStr === 'string' && dateStr.includes('T') && dateStr.includes('Z')) {
          return new Date(dateStr);
        }
        
        if (typeof dateStr === 'string') {
          if (dateStr.includes('-')) {
            const isoParts = dateStr.split('-');
            if (isoParts.length === 3 && isoParts[0].length === 4) {
              return new Date(dateStr);
            } else {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                return new Date(`${parts[1]}-${parts[0]}-${parts[2]}`);
              }
            }
          } else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
            }
          }
        }
        return new Date(dateStr);
      } catch (e) {
        return new Date();
      }
    };

    // Helper function to calculate percentage change
    const calculateTrend = (current, previous) => {
      if (isNaN(current) || isNaN(previous)) return 0;
      if (current === 0 && previous === 0) return 0;
      if (previous === 0 && current > 0) return 100;
      if (previous === 0 && current < 0) return -100;
      return parseFloat(((current - previous) / previous * 100).toFixed(2)) || 0;
    };

    // Batch process helper
    const batchProcess = (items, dateField, processFn) => {
      return items.reduce((acc, item) => {
        const date = parseDate(item[dateField]);
        if (date >= thirtyDaysAgo && date <= today) {
          acc.current += processFn(item);
        } else if (date >= sixtyDaysAgo && date < thirtyDaysAgo) {
          acc.previous += processFn(item);
        }
        return acc;
      }, { current: 0, previous: 0 });
    };

    // Revenue trend
    const revenue = batchProcess(
      tokens || [], 
      'date', 
      token => parseFloat(token.totalAmount) || 0
    );
    const revenueGrowth = calculateTrend(revenue.current, revenue.previous);

    // Expenses trend
    const expenseData = batchProcess(
      expenses || [], 
      'date', 
      expense => parseFloat(expense.amount) || 0
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

    return {
      revenueGrowth: parseFloat(revenueGrowth) || 0,
      expensesGrowth: parseFloat(expensesGrowth) || 0,
      profitGrowth: parseFloat(profitGrowth) || 0,
      marginGrowth: parseFloat(marginGrowth) || 0,
      tokensTrend: parseFloat(tokensTrend) || 0,
      exchangesTrend: parseFloat(exchangesTrend) || 0,
      weightTrend: parseFloat(weightTrend) || 0,
    };
  } catch (error) {
    return { 
      revenueGrowth: 0,
      expensesGrowth: 0,
      profitGrowth: 0,
      marginGrowth: 0,
      tokensTrend: 0,
      exchangesTrend: 0,
      weightTrend: 0
    };
  }
};

function useTrends({ tokens, expenses, entries, exchanges }) {
  const [trends, setTrends] = useState({
    revenueGrowth: 0,
    expensesGrowth: 0,
    profitGrowth: 0,
    marginGrowth: 0,
    tokensTrend: 0,
    exchangesTrend: 0,
    weightTrend: 0,
  });
  
  // Always use fallback since worker has issues
  useEffect(() => {
    const fallbackResult = calculateTrendsFallback({ tokens, expenses, entries, exchanges });
    setTrends(fallbackResult);
  }, [tokens, expenses, entries, exchanges]);
  
  return trends;
}

export default useTrends;