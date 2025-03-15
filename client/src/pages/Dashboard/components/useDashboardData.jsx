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
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'weekly':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        break;
      default: // daily
        startDate = new Date(today.setHours(0, 0, 0, 0));
    }

    const filtered = exchanges.filter(exchange => {
      if (!exchange.date) return false;

      try {
        const [day, month, year] = exchange.date.split('/');
        const exchangeDate = new Date(year, parseInt(month) - 1, parseInt(day));
        exchangeDate.setHours(0, 0, 0, 0);
        return exchangeDate >= startDate && exchangeDate <= today;
      } catch (err) {
        return false;
      }
    });

    return filtered;
  };

  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    if (exchanges.length > 0) {
      const filteredExchanges = getFilteredExchanges(exchanges, selectedPeriod);
      const NoofExchanges = exchanges.length;
      
      const totalWeight = filteredExchanges.reduce((sum, exchange) => {
        const weight = parseFloat(exchange.weight) || 0;
        return sum + (isNaN(weight) ? 0 : weight);
      }, 0);

      const totalExWeight = filteredExchanges.reduce((sum, exchange) => {
        const exweight = parseFloat(exchange.exweight) || 0;
        return sum + (isNaN(exweight) ? 0 : exweight);
      }, 0);

      setMetrics(prev => ({
        ...prev,
        totalExchanges: NoofExchanges,
        totalWeight: totalWeight,
        totalExWeight: totalExWeight
      }));
    }
  }, [exchanges, selectedPeriod]);

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
      
// Process exchange data to handle ISO date format
      const processedExchanges = exchangesData.map(exchange => {
        const isoDate = new Date(exchange.date);
        return {
          ...exchange,
// Convert to DD/MM/YYYY format
          date: `${isoDate.getDate().toString().padStart(2, '0')}/${(isoDate.getMonth() + 1).toString().padStart(2, '0')}/${isoDate.getFullYear()}`
        };
      });

      setExchanges(processedExchanges);

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
    todayTotal, dateRange, setDateRange, metrics, sparklineData, selectedPeriod, setSelectedPeriod
  };
};

export default useDashboardData;