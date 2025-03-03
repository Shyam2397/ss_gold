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
      const entriesData = entriesRes.data;
      const exchangesData = exchangesRes.data.data || [];
      const processedTokens = tokenData.map(token => ({
        ...token,
        totalAmount: parseFloat(token.amount || '0'),
        weight: parseFloat(token.weight || '0')
      }));

      setTokens(processedTokens);
      setEntries(entriesData);
      setExpenses(expensesRes.data);
      setExchanges(exchangesData);

      const filteredExchanges = getFilteredExchanges(exchangesData);
      setMetrics({
        totalCustomers: entriesData.length,
        totalTokens: processedTokens.length,
        skinTestCount: processedTokens.filter(token => token.test?.toLowerCase().includes('skin')).length,
        photoTestCount: processedTokens.filter(token => token.test?.toLowerCase().includes('photo')).length,
        totalExchanges: filteredExchanges.length,
        totalWeight: filteredExchanges.reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0),
        totalExWeight: filteredExchanges.reduce((sum, exchange) => sum + parseFloat(exchange.exWeight || '0'), 0)
      });

      // Add sparkline data and todayTotal calculations here (omitted for brevity, move from original)
      // ... [Your sparklineData and calculateTodayTotal logic here] ...

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