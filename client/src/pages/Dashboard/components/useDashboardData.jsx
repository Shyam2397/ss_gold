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

  const getFilteredExchanges = (exchanges, period = 'daily') => {
    if (!exchanges || exchanges.length === 0) return [];
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = new Date(today);

    // Set the start date based on period
    switch (period) {
      case 'yearly':
        startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        break;
      case 'weekly':
        // Set start date to beginning of current week (Sunday)
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      default: // daily
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    }

    startDate.setHours(0, 0, 0, 0);

    return exchanges.filter(exchange => {
      if (!exchange.date) return false;
      
      // Handle both DD-MM-YYYY and YYYY-MM-DD formats
      let exchangeDate;
      if (exchange.date.includes('-')) {
        const parts = exchange.date.split('-');
        if (parts[0].length === 4) {
          // YYYY-MM-DD format
          exchangeDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // DD-MM-YYYY format
          exchangeDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        return false;
      }

      // Set the time to noon to avoid timezone issues
      exchangeDate.setHours(12, 0, 0, 0);
      
      return exchangeDate >= startDate && exchangeDate <= today;
    });
  };

  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    if (exchanges.length > 0) {
      const filteredExchanges = getFilteredExchanges(exchanges, selectedPeriod);
      setMetrics(prev => ({
        ...prev,
        totalExchanges: exchanges.length,
        totalWeight: filteredExchanges.reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0),
        totalExWeight: filteredExchanges.reduce((sum, exchange) => sum + parseFloat(exchange.exweight || '0'), 0)
      }));
    }
  }, [dateRange, exchanges, selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const [tokensRes, expensesRes, entriesRes, exchangesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/tokens`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/expenses`),
        axios.get(`${import.meta.env.VITE_API_URL}/entries`),
        axios.get(`${import.meta.env.VITE_API_URL}/pure-exchange`)
      ]);

      const tokenData = tokensRes.data;
      const entriesData = entriesRes.data;
      const exchangesData = exchangesRes.data.data || [];
      const processedTokens = tokenData.map(token => {
        const processed = {
          ...token,
          totalAmount: parseFloat(token.amount || '0'),
          weight: parseFloat(token.weight || '0')
        };
        return processed;
      });

      setTokens(processedTokens);
      setEntries(entriesData);
      setExpenses(expensesRes.data);
      setExchanges(exchangesData);

      // Calculate total number of customers and test counts from entries
      const skinTestCount = processedTokens.filter(token => token.test === "Skin Test").length;
      const photoTestCount = processedTokens.filter(token => token.test === "Photo Testing").length;

      setMetrics(prev => ({
        ...prev,
        totalCustomers: entriesData.length,
        totalTokens: processedTokens.length,
        skinTestCount,
        photoTestCount
      }));

      // Calculate today's totals
      const today = new Date().toISOString();
      
      const todayTokens = processedTokens.filter(token => {
        if (!token.date) return false;
        const tokenDate = new Date(token.date);
        const todayDate = new Date(today);
        return tokenDate.getFullYear() === todayDate.getFullYear() &&
               tokenDate.getMonth() === todayDate.getMonth() &&
               tokenDate.getDate() === todayDate.getDate();
      });
     
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