import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const useDashboardData = () => {
  const [tokens, setTokens] = useState([]);
  const [entries, setEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayTotal, setTodayTotal] = useState({
    revenue: 0, expenses: 0, netTotal: 0,
    formattedRevenue: '₹0.00', formattedExpenses: '₹0.00', formattedNetTotal: '₹0.00'
  });
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [metrics, setMetrics] = useState({
    totalCustomers: 0, skinTestCount: 0, photoTestCount: 0, totalTokens: 0,
    totalExchanges: 0, totalWeight: 0, totalExWeight: 0
  });
  const [sparklineData, setSparklineData] = useState({
    revenue: [], expenses: [], profit: [], customers: [],
    skinTests: [], photoTests: [], weights: []
  });

  const getFilteredExchanges = (exchanges) => {
    return exchanges.filter(exchange => {
      const exchangeDate = new Date(exchange.date.split('-').reverse().join('-'));
      const fromDate = new Date(dateRange.fromDate);
      const toDate = new Date(dateRange.toDate);
      toDate.setHours(23, 59, 59, 999);
      return exchangeDate >= fromDate && exchangeDate <= toDate;
    });
  };

  useEffect(() => {
    if (exchanges.length > 0) {
      const filteredExchanges = getFilteredExchanges(exchanges);
      setMetrics(prev => ({
        ...prev,
        totalExchanges: filteredExchanges.length,
        totalWeight: filteredExchanges.reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0),
        totalExWeight: filteredExchanges.reduce((sum, exchange) => sum + parseFloat(exchange.exWeight || '0'), 0)
      }));
    }
  }, [dateRange, exchanges]);

  const fetchDashboardData = async () => {
    try {
      const [tokensRes, expensesRes, entriesRes, exchangesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/tokens`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/expenses`),
        axios.get(`${import.meta.env.VITE_API_URL}/entries`),
        axios.get(`${import.meta.env.VITE_API_URL}/pure-exchange`)
      ]);

      const tokenData = tokensRes.data;
      console.log('Raw token data:', tokenData);
      const entriesData = entriesRes.data;
      const exchangesData = exchangesRes.data.data || [];
      const processedTokens = tokenData.map(token => {
        const processed = {
          ...token,
          totalAmount: parseFloat(token.amount || '0'),
          weight: parseFloat(token.weight || '0')
        };
        console.log('Processed token:', processed);
        return processed;
      });

      setTokens(processedTokens);
      setEntries(entriesData);
      setExpenses(expensesRes.data);
      setExchanges(exchangesData);

      // Calculate today's totals
      const today = new Date().toISOString();
      console.log('Today\'s date:', today);
      const todayTokens = processedTokens.filter(token => {
        if (!token.date) return false;
        const tokenDate = new Date(token.date);
        const todayDate = new Date(today);
        return tokenDate.getFullYear() === todayDate.getFullYear() &&
               tokenDate.getMonth() === todayDate.getMonth() &&
               tokenDate.getDate() === todayDate.getDate();
      });
      console.log('Today\'s tokens:', todayTokens);
      const todayExpenses = expensesRes.data.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date.split('-').reverse().join('-'));
        const todayDate = new Date(today);
        return expenseDate.getFullYear() === todayDate.getFullYear() &&
               expenseDate.getMonth() === todayDate.getMonth() &&
               expenseDate.getDate() === todayDate.getDate();
      });

      const todayRevenue = todayTokens.reduce((sum, token) => sum + (token.totalAmount || 0), 0);
      const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      const todayNetTotal = todayRevenue - todayExpensesTotal;

      setTodayTotal({
        revenue: todayRevenue,
        expenses: todayExpensesTotal,
        netTotal: todayNetTotal,
        formattedRevenue: `₹${todayRevenue.toFixed(2)}`,
        formattedExpenses: `₹${todayExpensesTotal.toFixed(2)}`,
        formattedNetTotal: `₹${todayNetTotal.toFixed(2)}`
      });

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
      toast.success('Dashboard updated!', { icon: '🔄', position: 'top-right' });
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  return {
    tokens, entries, expenses, exchanges, loading, error, recentActivities,
    todayTotal, dateRange, setDateRange, metrics, sparklineData
  };
};

export default useDashboardData;