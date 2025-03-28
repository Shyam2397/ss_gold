import { useMemo } from 'react';

const useTrends = ({ tokens, expenses, entries, exchanges }) => {
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

  // Memoize all trend calculations to avoid recalculating unnecessarily
  const trends = useMemo(() => {
    // Revenue trend
    const currentRevenue = tokens
      .filter(token => {
        const tokenDate = parseDate(token.date);
        return tokenDate >= sevenDaysAgo && tokenDate <= today;
      })
      .reduce((sum, token) => sum + (token.totalAmount || 0), 0);

    const previousRevenue = tokens
      .filter(token => {
        const tokenDate = parseDate(token.date);
        return tokenDate >= fourteenDaysAgo && tokenDate < sevenDaysAgo;
      })
      .reduce((sum, token) => sum + (token.totalAmount || 0), 0);

    const revenueGrowth = calculateTrend(currentRevenue, previousRevenue);

    // Expenses trend
    const currentExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= sevenDaysAgo && expenseDate <= today;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const previousExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= fourteenDaysAgo && expenseDate < sevenDaysAgo;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const expensesGrowth = calculateTrend(currentExpenses, previousExpenses);

    // Net Profit trend
    const currentProfit = currentRevenue - currentExpenses;
    const previousProfit = previousRevenue - previousExpenses;
    const profitGrowth = calculateTrend(currentProfit, previousProfit);

    // Profit Margin trend
    const currentMargin = currentRevenue ? (currentProfit / currentRevenue) * 100 : 0;
    const previousMargin = previousRevenue ? (previousProfit / previousRevenue) * 100 : 0;
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
};

export default useTrends;