import { useMemo } from 'react';

function useTrends({ tokens, expenses, entries, exchanges }) {
  // Get dates for last 7 days and previous 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  // Helper function to calculate percentage change
  const calculateTrend = (current, previous) => 
    previous ? ((current - previous) / previous * 100).toFixed(2) : 0;

  // Optimize by using Set for faster lookups
  const uniqueDates = new Set();
  
  // Cache date parsing results
  const dateCache = new Map();
  
  // Add date parsing memoization
  const parseDate = (dateStr) => {
    if (!dateCache.has(dateStr)) {
      dateCache.set(dateStr, new Date(dateStr.split('-').reverse().join('-')));
    }
    return dateCache.get(dateStr);
  };

  // Add batch processing for better performance
  const batchProcess = (items, dateField, processFn) => {
    return items.reduce((acc, item) => {
      const date = parseDate(item[dateField]);
      if (date >= sevenDaysAgo && date <= today) {
        acc.current += processFn(item);
      } else if (date >= fourteenDaysAgo && date < sevenDaysAgo) {
        acc.previous += processFn(item);
      }
      return acc;
    }, { current: 0, previous: 0 });
  };

  // Memoize all trend calculations to avoid recalculating unnecessarily
  const trends = useMemo(() => {
    // Revenue trend
    const revenue = batchProcess(tokens, 'date', token => token.totalAmount || 0);
    const revenueGrowth = calculateTrend(revenue.current, revenue.previous);

    // Expenses trend
    const expenseData = batchProcess(expenses, 'date', expense => expense.amount || 0);
    const expensesGrowth = calculateTrend(expenseData.current, expenseData.previous);

    // Net Profit trend
    const currentProfit = revenue.current - expenseData.current;
    const previousProfit = revenue.previous - expenseData.previous;
    const profitGrowth = calculateTrend(currentProfit, previousProfit);

    // Profit Margin trend
    const currentMargin = revenue.current ? (currentProfit / revenue.current) * 100 : 0;
    const previousMargin = revenue.previous ? (previousProfit / revenue.previous) * 100 : 0;
    const marginGrowth = calculateTrend(currentMargin, previousMargin);

    // Customer trend
    const currentCustomers = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= sevenDaysAgo && entryDate <= today;
    }).length;

    const previousCustomers = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= fourteenDaysAgo && entryDate < sevenDaysAgo;
    }).length;

    const customersTrend = calculateTrend(currentCustomers, previousCustomers);

    // Token trend
    const currentTokens = tokens.filter(token => {
      const tokenDate = parseDate(token.date);
      return tokenDate >= sevenDaysAgo && tokenDate <= today;
    }).length;

    const previousTokens = tokens.filter(token => {
      const tokenDate = parseDate(token.date);
      return tokenDate >= fourteenDaysAgo && tokenDate < sevenDaysAgo;
    }).length;

    const tokensTrend = calculateTrend(currentTokens, previousTokens);

    // Exchange trend
    const currentExchanges = exchanges.filter(exchange => {
      const exchangeDate = parseDate(exchange.date);
      return exchangeDate >= sevenDaysAgo && exchangeDate <= today;
    }).length;

    const previousExchanges = exchanges.filter(exchange => {
      const exchangeDate = parseDate(exchange.date);
      return exchangeDate >= fourteenDaysAgo && exchangeDate < sevenDaysAgo;
    }).length;

    const exchangesTrend = calculateTrend(currentExchanges, previousExchanges);

    // Weight trend
    const currentWeight = exchanges
      .filter(exchange => {
        const exchangeDate = parseDate(exchange.date);
        return exchangeDate >= sevenDaysAgo && exchangeDate <= today;
      })
      .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

    const previousWeight = exchanges
      .filter(exchange => {
        const exchangeDate = parseDate(exchange.date);
        return exchangeDate >= fourteenDaysAgo && exchangeDate < sevenDaysAgo;
      })
      .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

    const weightTrend = calculateTrend(currentWeight, previousWeight);

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
  }, [tokens, expenses, entries, exchanges]);

  return trends;
}

export default useTrends;