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

  const processRecentActivities = (tokens, expenses, exchanges, entries) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let uniqueCounter = 0;
    const getUniqueId = (prefix, id) => {
      uniqueCounter += 1;
      return `${prefix}-${id || uniqueCounter}-${Date.now()}-${uniqueCounter}`;
    };

    const isToday = (dateStr) => {
      try {
        let date;
        if (typeof dateStr === 'string') {
          // Handle different date formats
          if (dateStr.includes('-')) {
            // For YYYY-MM-DD format
            date = new Date(dateStr);
          } else if (dateStr.includes('/')) {
            // For DD/MM/YYYY format
            const [day, month, year] = dateStr.split('/');
            date = new Date(year, month - 1, day);
          } else {
            // For ISO string
            date = new Date(dateStr);
          }
        } else {
          date = new Date(dateStr);
        }
        
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
      } catch (err) {
        console.error('Date parsing error:', err);
        return false;
      }
    };

    const activities = [
      ...tokens
        .filter(token => token.date && isToday(token.date))
        .map(token => {
          // Create a date object from the token's date and time
          const tokenDate = new Date(token.date);
          if (token.time) {
            const [hours, minutes] = token.time.split(':');
            tokenDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          }
          
          return {
            id: `token-${token._id || token.token_no || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'token',
            action: `${token.test || 'Token'} - ${token.name || 'Unknown'}`,
            amount: parseFloat(token.amount || 0),
            time: tokenDate,
            details: `Weight: ${parseFloat(token.weight || 0).toFixed(3)}g`
          };
        }),
      ...expenses
        .filter(expense => expense.date && isToday(expense.date))
        .map(expense => ({
          id: getUniqueId('expense', expense._id),
          type: 'expense',
          action: expense.description || 'Expense added',
          amount: -parseFloat(expense.amount || 0),
          time: new Date(expense.created_at || expense.date),
          details: `Category: ${expense.expense_type || 'Uncategorized'}`
        })),
      ...exchanges
        .filter(exchange => exchange.date && isToday(exchange.date))
        .map(exchange => ({
          id: getUniqueId('exchange', exchange._id),
          type: 'exchange',
          action: 'Exchange recorded',
          amount: 0,
          time: exchange.time ? 
            new Date(`${exchange.date.split('/').reverse().join('-')}T${exchange.time}`) :
            new Date(exchange.date.split('/').reverse().join('-')),
          details: `Impure: ${parseFloat(exchange.weight || 0).toFixed(3)}g → Pure: ${parseFloat(exchange.exweight || 0).toFixed(3)}g`
        })),
      ...entries
        .filter(entry => entry.created_at && isToday(entry.created_at))
        .map(entry => ({
          id: getUniqueId('entry', entry._id),
          type: 'entry',
          action: 'New customer registered',
          amount: 0,
          time: new Date(entry.created_at),
          details: entry.name || 'Unknown customer'
        }))
    ];

    // Use original timestamps for sorting and display
    return activities
      .filter(activity => activity.time instanceof Date && !isNaN(activity.time))
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .map(activity => ({
        ...activity,
        time: activity.time.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }));
  };

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
        try {
          const isoDate = new Date(exchange.date);
          return {
            ...exchange,
// Convert to DD/MM/YYYY format and ensure weight is a number
            date: `${isoDate.getDate().toString().padStart(2, '0')}/${(isoDate.getMonth() + 1).toString().padStart(2, '0')}/${isoDate.getFullYear()}`,
            weight: parseFloat(exchange.weight || '0'),
            exweight: parseFloat(exchange.exweight || '0')
          };
        } catch (err) {
          console.error('Error processing exchange:', err);
          return null;
        }
      }).filter(Boolean); // Remove any null values

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

      const recentActivities = processRecentActivities(
        processedTokens,
        expensesRes.data,
        processedExchanges,
        entriesData
      );
      setRecentActivities(recentActivities);

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