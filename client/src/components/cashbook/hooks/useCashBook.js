import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper functions
const calculatePreviousIncome = (tokens, lastDayOfPreviousMonth) => {
  return tokens.reduce((sum, token) => {
    const transactionDate = new Date(token.date);
    return transactionDate <= lastDayOfPreviousMonth && token.isPaid 
      ? sum + parseFloat(token.amount || 0) 
      : sum;
  }, 0);
};

const calculatePreviousPending = (tokens, lastDayOfPreviousMonth) => {
  return tokens.reduce((sum, token) => {
    const transactionDate = new Date(token.date);
    return transactionDate <= lastDayOfPreviousMonth && !token.isPaid 
      ? sum + parseFloat(token.amount || 0) 
      : sum;
  }, 0);
};

const calculatePreviousExpenses = (expenses, lastDayOfPreviousMonth) => {
  return expenses.reduce((sum, expense) => {
    const transactionDate = new Date(expense.date);
    return transactionDate <= lastDayOfPreviousMonth 
      ? sum + parseFloat(expense.amount || 0) 
      : sum;
  }, 0);
};

const processTokenTransactions = (tokens) => {
  return tokens.map(token => ({
    id: `token-${token.id}`,
    date: token.date,
    particulars: {
      test: token.test || 'No Test',
      tokenNo: token.tokenNo,
      name: token.name
    },
    type: token.isPaid ? 'Income' : 'Pending',
    debit: token.isPaid ? 0 : parseFloat(token.amount) || 0,
    credit: token.isPaid ? parseFloat(token.amount) || 0 : 0,
    isPaid: token.isPaid,
    amount: parseFloat(token.amount) || 0
  }));
};

const processExpenseTransactions = (expenses) => {
  return expenses.map(expense => ({
    id: `expense-${expense.id}`,
    date: expense.date,
    particulars: `${expense.expense_type} - ${expense.paid_to || 'N/A'}`,
    type: 'Expense',
    debit: parseFloat(expense.amount) || 0,
    credit: 0
  }));
};

const calculateFilteredTransactions = (transactions) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const calculateRunningBalances = (transactions, firstDayOfMonth, lastDayOfMonth, openingBalance, openingPending) => {
  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
  });

  let runningBalance = openingBalance;
  let runningPending = openingPending;
  
  return currentMonthTransactions.map(transaction => {
    if (transaction.type === 'Pending') {
      runningPending += transaction.debit;
      return { ...transaction, runningBalance, pendingBalance: runningPending };
    } else {
      runningBalance += (transaction.credit || 0) - (transaction.debit || 0);
      return { ...transaction, runningBalance, pendingBalance: runningPending };
    }
  });
};

const calculateCashInfo = (filteredTxns, prevCashInfo) => {
  const totals = filteredTxns.reduce((acc, curr) => {
    if (curr.type === 'Income') {
      acc.totalIncome += (curr.credit || 0);
    } else if (curr.type === 'Expense') {
      acc.totalExpense += (curr.debit || 0);
    } else if (curr.type === 'Pending') {
      acc.totalPending += (curr.debit || 0);
    }
    return acc;
  }, {
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0
  });

  const netChange = totals.totalIncome - totals.totalExpense;
  const totalPending = prevCashInfo.openingPending + totals.totalPending;

  return {
    ...prevCashInfo,
    ...totals,
    totalPending,
    netChange,
    closingBalance: prevCashInfo.openingBalance + netChange
  };
};

const calculateAnalytics = (filteredTxns, allTransactions) => {
  // Calculate category summary
  const categories = filteredTxns.reduce((acc, curr) => {
    if (curr.type === 'Expense') {
      const category = typeof curr.particulars === 'string' 
        ? curr.particulars.split(' - ')[0]
        : 'Other';
      if (!acc[category]) acc[category] = 0;
      acc[category] += curr.debit;
    }
    return acc;
  }, {});

  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Improved monthly summary calculation with proper date ranges
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);
    
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      startDate: firstDay,
      endDate: lastDay,
      income: 0,
      expense: 0,
      pending: 0,
      netChange: 0
    };
  });

  // Process all transactions for monthly data
  allTransactions.forEach(transaction => {
    const transDate = new Date(transaction.date);
    
    // Find matching month data
    const monthData = last6Months.find(m => 
      transDate >= m.startDate && transDate <= m.endDate
    );
    
    if (monthData) {
      if (transaction.type === 'Income') {
        const income = parseFloat(transaction.credit || 0);
        monthData.income += income;
        monthData.netChange += income;
      } else if (transaction.type === 'Expense') {
        const expense = parseFloat(transaction.debit || 0);
        monthData.expense += expense;
        monthData.netChange -= expense;
      } else if (transaction.type === 'Pending') {
        monthData.pending += parseFloat(transaction.debit || 0);
      }
    }
  });

  // Format the monthly data
  const formattedMonthlyData = last6Months
    .map(({ month, income, expense, pending, netChange }) => ({
      month,
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      pending: Number(pending.toFixed(2)),
      netChange: Number(netChange.toFixed(2))
    }))
    .reverse();

  return {
    categories: sortedCategories,
    monthly: formattedMonthlyData
  };
};

export function useCashBook() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [cashInfo, setCashInfo] = useState({
    openingBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0,
    netChange: 0,
    closingBalance: 0,
    openingPending: 0
  });
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categorySummary, setCategorySummary] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError('');
    
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Calculate all required dates
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
      const lastDayOfPreviousMonth = new Date(currentYear, currentMonth, 0);
      const firstDayOfAllTime = new Date(2000, 0, 1);
      
      // Calculate date 6 months ago for monthly overview
      const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
      
      // Fetch data for opening balance and monthly overview
      const [previousTokensResponse, previousExpensesResponse, monthlyTokensResponse, monthlyExpensesResponse] = await Promise.all([
        // For opening balance
        axios.get(`${API_BASE_URL}/tokens`, {
          params: {
            from_date: firstDayOfAllTime.toISOString().split('T')[0],
            to_date: lastDayOfPreviousMonth.toISOString().split('T')[0]
          }
        }),
        axios.get(`${API_BASE_URL}/api/expenses`, {
          params: {
            from_date: firstDayOfAllTime.toISOString().split('T')[0],
            to_date: lastDayOfPreviousMonth.toISOString().split('T')[0]
          }
        }),
        // For monthly overview
        axios.get(`${API_BASE_URL}/tokens`, {
          params: {
            from_date: sixMonthsAgo.toISOString().split('T')[0],
            to_date: lastDayOfCurrentMonth.toISOString().split('T')[0]
          }
        }),
        axios.get(`${API_BASE_URL}/api/expenses`, {
          params: {
            from_date: sixMonthsAgo.toISOString().split('T')[0],
            to_date: lastDayOfCurrentMonth.toISOString().split('T')[0]
          }
        })
      ]);

      // Process opening balance data
      const previousIncome = calculatePreviousIncome(previousTokensResponse.data, lastDayOfPreviousMonth);
      const previousPending = calculatePreviousPending(previousTokensResponse.data, lastDayOfPreviousMonth);
      const previousExpenses = calculatePreviousExpenses(previousExpensesResponse.data, lastDayOfPreviousMonth);
      
      const openingBalance = previousIncome - previousExpenses;
      const openingPending = previousPending;
      
      // Set opening balance in cashInfo
      setCashInfo(prev => ({ 
        ...prev, 
        openingBalance, 
        openingPending,
        totalIncome: 0,
        totalExpense: 0,
        totalPending: 0,
        netChange: 0,
        closingBalance: openingBalance
      }));

      // Process current month transactions for table display
      const currentTransactions = [
        ...processTokenTransactions(
          monthlyTokensResponse.data.filter(t => 
            new Date(t.date) >= firstDayOfMonth && 
            new Date(t.date) <= lastDayOfCurrentMonth
          )
        ),
        ...processExpenseTransactions(
          monthlyExpensesResponse.data.filter(e => 
            new Date(e.date) >= firstDayOfMonth && 
            new Date(e.date) <= lastDayOfCurrentMonth
          )
        )
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Process all transactions for monthly overview
      const allMonthlyTransactions = [
        ...processTokenTransactions(monthlyTokensResponse.data),
        ...processExpenseTransactions(monthlyExpensesResponse.data)
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate running balances for current month
      const transactionsWithBalance = calculateRunningBalances(
        currentTransactions,
        firstDayOfMonth,
        lastDayOfCurrentMonth,
        openingBalance,
        openingPending
      );

      setTransactions(allMonthlyTransactions); // Store all transactions for analytics
      setFilteredTransactions(transactionsWithBalance); // Store current month transactions for table

    } catch (err) {
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  const handleAdjustmentSave = useCallback(async (adjustmentData) => {
    setLoading(true);
    try {
      if (adjustmentData.type === 'debit') {
        await axios.post(`${API_BASE_URL}/api/expenses`, {
          date: adjustmentData.date,
          expense_type: 'Cash Adjustment',
          paid_to: adjustmentData.remarks || 'Cash Adjustment',
          amount: adjustmentData.amount,
          payment_mode: 'Cash',
          remarks: 'Manual cash adjustment'
        });
      } else {
        await axios.post(`${API_BASE_URL}/tokens`, {
          date: adjustmentData.date,
          tokenNo: `ADJ-${Date.now()}`,
          name: adjustmentData.remarks || 'Cash Adjustment',
          amount: adjustmentData.amount,
          payment_mode: 'Cash',
          remarks: 'Manual cash adjustment'
        });
      }
      
      await fetchTransactions();
      setShowAdjustment(false);
    } catch (err) {
      setError('Failed to save adjustment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  const debouncedFetch = useMemo(
    () => debounce((isRefresh) => fetchTransactions(isRefresh), 1000),
    [fetchTransactions]
  );

  // Combine fetch-related effects into one
  useEffect(() => {
    let pollInterval;
    const initializeData = async () => {
      await fetchTransactions();
      // Setup polling only after initial fetch
      pollInterval = setInterval(() => {
        if (!loading && !isInitialLoading && !isRefreshing) {
          fetchTransactions(true);
        }
      }, 30000);
    };

    initializeData();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []); // Run only on mount

  // Memoize calculations once
  const memoizedData = useMemo(() => {
    const filteredTxns = calculateFilteredTransactions(transactions);
    const cashData = calculateCashInfo(filteredTxns, {
      openingBalance: cashInfo.openingBalance,
      openingPending: cashInfo.openingPending
    });
    const analytics = calculateAnalytics(filteredTxns, transactions);
    
    return {
      filteredTransactions: filteredTxns,
      cashInfo: cashData,
      analytics
    };
  }, [transactions, cashInfo.openingBalance, cashInfo.openingPending]);

  // Single effect for all state updates
  useEffect(() => {
    const { filteredTransactions: newFilteredTxns, cashInfo: newCashInfo, analytics } = memoizedData;
    
    setFilteredTransactions(newFilteredTxns);
    setCashInfo(prev => ({
      ...prev,
      totalIncome: newCashInfo.totalIncome,
      totalExpense: newCashInfo.totalExpense,
      totalPending: newCashInfo.totalPending,
      netChange: newCashInfo.netChange,
      closingBalance: newCashInfo.closingBalance
    }));
    setCategorySummary(analytics.categories);
    setMonthlySummary(analytics.monthly);
  }, [memoizedData]);

  // Memoize callbacks
  const rowGetter = useCallback(({ index }) => {
    if (index === 0) return { type: 'opening' };
    if (index === filteredTransactions.length + 1) return { type: 'closing' };
    return filteredTransactions[index - 1];
  }, [filteredTransactions]);

  const getRowStyle = useCallback(({ index }) => {
    return {
      backgroundColor: 
        index === 0 ? 'rgb(255, 251, 235)' :
        index === filteredTransactions.length + 1 ? 'rgb(255, 251, 235)' :
        index % 2 === 0 ? '#fff' : 'rgba(255, 251, 235, 0.4)'
    };
  }, [filteredTransactions.length]);

  const handleExport = useCallback((type) => {
    switch(type) {
      case 'excel':
        // TODO: Implement Excel export
        window.print(); // Temporary fallback
        break;
      case 'print':
        window.print();
        break;
      case 'email':
        // TODO: Implement email functionality
        break;
      default:
        break;
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    filteredTransactions,
    cashInfo,
    activeTab,
    showAdjustment,
    isInitialLoading,
    isRefreshing,
    categorySummary,
    monthlySummary,
    setActiveTab,
    setShowAdjustment,
    handleAdjustmentSave,
    handleExport,
    fetchTransactions,
    rowGetter,
    getRowStyle
  };
}
