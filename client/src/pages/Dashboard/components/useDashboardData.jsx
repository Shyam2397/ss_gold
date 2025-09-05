import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getApi } from '../../../services/api';
import { fetchCashAdjustments } from '../services/dashboardService';
import toast from 'react-hot-toast';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';

// Constants for pagination and caching
const PAGE_SIZE = 50;
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

function useDashboardData() {
  const [tokens, setTokens] = useState([]);
  const [entries, setEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [cashAdjustments, setCashAdjustments] = useState([]);
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

  const queryClient = useQueryClient();
  const abortControllersRef = useRef(new Map());
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized api instance with abort controller
  const api = useMemo(() => {
    // Cancel any pending requests when component unmounts or dependencies change
    const controller = new AbortController();
    
    const makeRequest = async (config) => {
      const api = await getApi();
      return api({
        ...config,
        signal: controller.signal
      });
    };

    return {
      get: (url, config) => makeRequest({ ...config, method: 'get', url }),
      post: (url, data, config) => makeRequest({ ...config, method: 'post', url, data }),
      put: (url, data, config) => makeRequest({ ...config, method: 'put', url, data }),
      delete: (url, config) => makeRequest({ ...config, method: 'delete', url })
    };
  }, []);

  // Memoized query functions with pagination
  const queryFns = useMemo(() => ({
    tokens: async () => {
      const { data } = await api.get(`/tokens?page=${currentPage}&limit=${PAGE_SIZE}`);
      return data;
    },
    expenses: async () => {
      const { data } = await api.get(`/api/expenses?page=${currentPage}&limit=${PAGE_SIZE}`);
      return data;
    },
    entries: async () => {
      const { data } = await api.get(`/entries?page=${currentPage}&limit=${PAGE_SIZE}`);
      return data;
    },
    exchanges: async () => {
      const { data } = await api.get(`/pure-exchange?page=${currentPage}&limit=${PAGE_SIZE}`);
      return data.data || [];
    },
    cashAdjustments: async () => {
      const { data } = await api.get(`/api/cash-adjustments?page=${currentPage}&limit=${PAGE_SIZE}`);
      return data || [];
    }
  }), [currentPage]);

  // Enhanced queries with proper caching and staleness
  const queries = useQueries({
    queries: [
      {
        queryKey: ['tokens', currentPage],
        queryFn: queryFns.tokens,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        keepPreviousData: true
      },
      {
        queryKey: ['expenses', currentPage],
        queryFn: queryFns.expenses,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        keepPreviousData: true
      },
      {
        queryKey: ['cashAdjustments', currentPage],
        queryFn: queryFns.cashAdjustments,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        keepPreviousData: true
      },
      {
        queryKey: ['entries', currentPage],
        queryFn: queryFns.entries,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        keepPreviousData: true
      },
      {
        queryKey: ['exchanges', currentPage],
        queryFn: queryFns.exchanges,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        keepPreviousData: true
      }
    ]
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

  const parseDate = (dateStr, timeStr) => {
    try {
      if (!dateStr) return new Date(NaN);
      
      let date;
      // Handle different date formats
      if (dateStr.includes('-')) {
        // For YYYY-MM-DD format
        date = new Date(dateStr);
      } else if (dateStr.includes('/')) {
        // For DD/MM/YYYY format
        const [day, month, year] = dateStr.split('/');
        date = new Date(year, month - 1, day);
      } else {
        // For ISO string or other formats
        date = new Date(dateStr);
      }
      
      // If time is provided, set the time
      if (timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':');
        date.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, parseInt(seconds, 10) || 0);
      } else {
        // Default to current time if no time provided
        date.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
      }
      
      return date;
    } catch (err) {
      console.error('Date parsing error:', err);
      return new Date(NaN);
    }
  };

  const processRecentActivities = (tokens, expenses, exchanges, entries, cashAdjustments) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getUniqueId = (prefix, id) => {
      const uniqueCounter = Math.floor(Math.random() * 1000);
      return `${prefix}-${id || uniqueCounter}-${Date.now()}-${uniqueCounter}`;
    };

    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const date = parseDate(dateStr);
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    const activities = [
      ...tokens
        .filter(token => token.date && isToday(token.date))
        .map(token => {
          const time = parseDate(token.date, token.time);
          return {
            id: `token-${token._id || token.token_no || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'token',
            action: `${token.test || 'Token'} - ${token.name || 'Unknown'}`,
            amount: parseFloat(token.amount || 0),
            time: time,
            details: `Weight: ${parseFloat(token.weight || 0).toFixed(3)}g`,
            _sortTime: time.getTime()
          };
        }),
      ...expenses
        .filter(expense => expense.date && isToday(expense.date))
        .map(expense => {
          const time = parseDate(expense.created_at || expense.date);
          return {
            id: getUniqueId('expense', expense._id),
            type: 'expense',
            action: expense.description || 'Expense added',
            amount: -parseFloat(expense.amount || 0),
            time: time,
            details: `Category: ${expense.expense_type || 'Uncategorized'}`,
            _sortTime: time.getTime()
          };
        }),
      ...exchanges
        .filter(exchange => exchange.date && isToday(exchange.date))
        .map(exchange => {
          const time = parseDate(exchange.date, exchange.time);
          return {
            id: getUniqueId('exchange', exchange._id),
            type: 'exchange',
            action: 'Exchange recorded',
            amount: 0,
            time: time,
            details: `Impure: ${parseFloat(exchange.weight || 0).toFixed(3)}g → Pure: ${parseFloat(exchange.exweight || 0).toFixed(3)}g`,
            _sortTime: time.getTime()
          };
        }),
      ...entries
        .filter(entry => entry.created_at && isToday(entry.created_at))
        .map(entry => {
          const time = parseDate(entry.created_at);
          return {
            id: getUniqueId('entry', entry._id),
            type: 'entry',
            action: 'New customer registered',
            amount: 0,
            time: time,
            details: entry.name || 'Unknown customer',
            _sortTime: time.getTime()
          };
        }),
      // In useDashboardData.jsx, update the cash adjustments mapping
      ...(Array.isArray(cashAdjustments) ? cashAdjustments : [])
      .filter(adjustment => adjustment && adjustment.date && isToday(adjustment.date))
      .map(adjustment => {
        const amount = parseFloat(adjustment?.amount || 0);
        const isCredit = adjustment?.adjustment_type?.toLowerCase() === 'addition';
        const action = isCredit ? 'Cash Added' : 'Cash Deducted';
        const time = parseDate(adjustment.date, adjustment.time);
  
        return {
          id: getUniqueId('adjustment', adjustment?._id),
          type: 'adjustment',
          action: action,
          amount: isCredit ? amount : -amount,
          time: time,
          details: `Reason: ${adjustment?.reason || 'No reason provided'}`,
          reference: adjustment?.reference_number ? `Ref: ${adjustment.reference_number}` : '',
          remarks: adjustment?.remarks,
          isCredit: isCredit,
          _sortTime: time.getTime()
        };
      })
    ];

    // Filter out invalid dates and sort by timestamp
    const validActivities = activities.filter(activity => 
      activity.time instanceof Date && !isNaN(activity.time.getTime())
    );

    // Sort by the pre-calculated timestamp (most recent first)
    const sortedActivities = [...validActivities].sort((a, b) => {
      // Use _sortTime if available, otherwise fall back to time.getTime()
      const timeA = a._sortTime || a.time.getTime();
      const timeB = b._sortTime || b.time.getTime();
      return timeB - timeA;
    });

    // Format the display time and remove internal fields
    return sortedActivities.map(activity => {
      const displayTime = activity.time.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Remove internal fields and add displayTime
      const { _sortTime, ...rest } = activity;
      return {
        ...rest,
        time: displayTime
      };
    });
  };

  const processTokenData = useCallback((tokens) => {
    return tokens.map(token => ({
      ...token,
      totalAmount: parseFloat(token.amount || '0'),
      weight: parseFloat(token.weight || '0')
    }));
  }, []);

  const processExchangeData = useCallback((exchanges) => {
    return exchanges.map(exchange => {
      try {
        const isoDate = new Date(exchange.date);
        return {
          ...exchange,
          date: `${isoDate.getDate().toString().padStart(2, '0')}/${(isoDate.getMonth() + 1).toString().padStart(2, '0')}/${isoDate.getFullYear()}`,
          weight: parseFloat(exchange.weight || '0'),
          exweight: parseFloat(exchange.exweight || '0')
        };
      } catch (err) {
        console.error('Error processing exchange:', err);
        return null;
      }
    }).filter(Boolean);
  }, []);

  const debouncedDataUpdate = useMemo(
    () => debounce((newData) => {
      // Update state with new data
      Object.entries(newData).forEach(([key, value]) => {
        queryClient.setQueryData([key, currentPage], value);
      });
    }, 300),
    [currentPage]
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get a single API instance for all requests
      const api = await getApi();
      
      // Fetch data in parallel
      const [
        tokensResult,
        expensesResult,
        entriesResult,
        exchangesResult
      ] = await Promise.all([
        api.get('/tokens'),
        api.get('/api/expenses'),
        api.get('/entries'),
        api.get('/pure-exchange')
      ]);

      // Fetch cash adjustments using the service
      const cashAdjustmentsData = await fetchCashAdjustments();
      
      const tokenData = tokensResult?.data || [];
      const entriesData = entriesResult?.data || [];
      const exchangesData = exchangesResult?.data?.data || [];
      
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
      setCashAdjustments(cashAdjustmentsData);

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
      
      // Process expenses to ensure amount is a number
      const processedExpenses = (expensesResult?.data || []).map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount || '0')
      }));
      setExpenses(processedExpenses);

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
     
      const todayExpenses = expensesResult.data.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date); // Expense dates are already in YYYY-MM-DD format
        const todayDate = new Date(today);
        return expenseDate.getFullYear() === todayDate.getFullYear() &&
               expenseDate.getMonth() === todayDate.getMonth() &&
               expenseDate.getDate() === todayDate.getDate();
      });

      const todayCashAdjustments = cashAdjustmentsData.filter(adjustment => {
        if (!adjustment.date) return false;
        const adjustmentDate = new Date(adjustment.date); // Adjustment dates are already in YYYY-MM-DD format
        const todayDate = new Date(today);
        return adjustmentDate.getFullYear() === todayDate.getFullYear() &&
               adjustmentDate.getMonth() === todayDate.getMonth() &&
               adjustmentDate.getDate() === todayDate.getDate();
      });

      const todayRevenue = todayTokens.reduce((sum, token) => sum + (token.totalAmount || 0), 0);
      const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      const todayCashAdjustmentsTotal = todayCashAdjustments.reduce((sum, adjustment) => sum + (parseFloat(adjustment.amount) || 0), 0);
      const todayNetTotal = todayRevenue - todayExpensesTotal + todayCashAdjustmentsTotal;

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
        expensesResult.data,
        processedExchanges,
        entriesData,
        cashAdjustmentsData
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

  useEffect(() => {
    return () => {
      // Cancel all pending requests
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      // Clear cache older than 5 minutes
      queryClient.clear();
    };
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  // Pre-fetch next page
  useEffect(() => {
    const prefetchNextPage = async () => {
      await queryClient.prefetchQuery(['tokens', currentPage + 1], queryFns.tokens);
      await queryClient.prefetchQuery(['expenses', currentPage + 1], queryFns.expenses);
      await queryClient.prefetchQuery(['cashAdjustments', currentPage + 1], queryFns.cashAdjustments);
      await queryClient.prefetchQuery(['entries', currentPage + 1], queryFns.entries);
      await queryClient.prefetchQuery(['exchanges', currentPage + 1], queryFns.exchanges);
    };
    prefetchNextPage();
  }, [currentPage]);

  return {
    tokens,
    entries,
    expenses,
    exchanges,
    cashAdjustments,
    loading,
    error,
    recentActivities,
    todayTotal,
    dateRange,
    setDateRange,
    metrics,
    sparklineData,
    selectedPeriod,
    setSelectedPeriod,
    currentPage,
    handlePageChange,
    hasNextPage: queries[0].hasNextPage,
    isFetchingNextPage: queries[0].isFetchingNextPage
  };
}

export { useDashboardData };