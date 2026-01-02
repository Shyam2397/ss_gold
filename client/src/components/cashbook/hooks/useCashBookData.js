import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import apiService from '../../../services/api';
import cashAdjustmentService from '../../../services/cashAdjustmentService';
import { calculateBalance, processTransactions, processTransactionTotals } from '../utils/transactionUtils';

export const useCashBookData = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cashInfo, setCashInfo] = useState({
    openingBalance: 0,
    openingPending: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0,
    netChange: 0,
    closingBalance: 0
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const firstDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfPreviousMonth = new Date(currentYear, currentMonth, 0);
      lastDayOfPreviousMonth.setHours(23, 59, 59, 999); // Set to end of day
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const firstDayFormatted = formatDate(firstDayOfMonth);
      const lastDayFormatted = formatDate(lastDayOfMonth);
      const firstDayOfAllTime = formatDate(new Date(2000, 0, 1));
      const lastDayOfPreviousMonthFormatted = formatDate(lastDayOfPreviousMonth);
      
      const api = await apiService.getApi();
      
      // Fetch all previous transactions and adjustments
      const [previousTokensResponse, previousExpensesResponse, previousAdjustments] = await Promise.all([
        api.get('/tokens', {
          params: {
            from_date: firstDayOfAllTime,
            to_date: lastDayOfPreviousMonthFormatted
          }
        }),
        api.get('/api/expenses', {
          params: {
            from_date: firstDayOfAllTime,
            to_date: lastDayOfPreviousMonthFormatted
          }
        }),
        cashAdjustmentService.getAdjustments({
          from_date: firstDayOfAllTime,
          to_date: lastDayOfPreviousMonthFormatted
        })
      ]);

      // Calculate previous month totals
      const previousIncome = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return token.isPaid ? sum + parseFloat(token.amount || 0) : sum;
        }
        return sum;
      }, 0);

      const previousExpenses = previousExpensesResponse.data.reduce((sum, expense) => {
        const transactionDate = new Date(expense.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return sum + parseFloat(expense.amount || 0);
        }
        return sum;
      }, 0);

      const previousAdjustmentTotal = previousAdjustments.reduce((sum, adj) => {
        const transactionDate = new Date(adj.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          const amount = parseFloat(adj.amount || 0);
          return adj.adjustment_type === 'addition' ? sum + amount : sum - amount;
        }
        return sum;
      }, 0);

      // Calculate pending amount separately
      const previousPending = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return !token.isPaid ? sum + parseFloat(token.amount || 0) : sum;
        }
        return sum;
      }, 0);

      // Final opening balance calculation & Diagnostic Logging
      const openingBalance = previousIncome + previousAdjustmentTotal - previousExpenses;
      const openingPending = previousPending;

      console.log('--- Opening Balance Calculation ---');
      console.log('Last Day of Previous Month:', lastDayOfPreviousMonth.toString());
      console.log('Previous Income (Tokens):', previousIncome);
      console.log('Previous Expenses:', previousExpenses);
      console.log('Previous Adjustments Total:', previousAdjustmentTotal);
      console.log('Calculated Opening Balance:', openingBalance);
      console.log('--- End of Calculation ---');

      setCashInfo(prev => ({
        ...prev,
        openingBalance,
        openingPending
      }));

      // Fetch current month transactions
      const [tokensResponse, expensesResponse, adjustments] = await Promise.all([
        api.get('/tokens', {
          params: {
            from_date: firstDayFormatted,
            to_date: lastDayFormatted
          }
        }),
        api.get('/api/expenses', {
          params: {
            from_date: firstDayFormatted,
            to_date: lastDayFormatted
          }
        }),
        cashAdjustmentService.getAdjustments({
          from_date: firstDayFormatted,
          to_date: lastDayFormatted
        })
      ]);

      // Process token transactions
      const tokenTransactions = tokensResponse.data.map(token => {
        const amount = parseFloat(token.amount) || 0;
        const isPaid = Boolean(token.isPaid);
        const type = isPaid ? 'Income' : 'Pending';
        
        return {
          id: `token-${token.id}`,
          date: token.date,
          particulars: {
            test: token.test || 'No Test',
            tokenNo: token.tokenNo,
            name: token.name
          },
          type,
          isPaid,
          amount,
          source: 'token',
          credit: isPaid ? amount : 0,
          debit: !isPaid ? amount : 0,
          paymentStatus: isPaid ? 'Paid' : 'Pending'
        };
      });

      // Process expense transactions
      const expenseTransactions = expensesResponse.data.map(expense => ({
        id: `expense-${expense.id}`,
        date: expense.date,
        particulars: `${expense.expense_type} - ${expense.paid_to || 'N/A'}`,
        type: 'Expense',
        debit: parseFloat(expense.amount) || 0,
        credit: 0
      }));

      // Process adjustment transactions
      const adjustmentTransactions = adjustments.map(adj => ({
        id: `adjustment-${adj.id}`,
        date: adj.date,
        time: adj.time,
        particulars: `Cash Adjustment: ${adj.reason}${adj.reference_number ? ` (Ref: ${adj.reference_number})` : ''}`,
        type: adj.adjustment_type === 'addition' ? 'Income' : 'Expense',
        debit: adj.adjustment_type === 'deduction' ? parseFloat(adj.amount) || 0 : 0,
        credit: adj.adjustment_type === 'addition' ? parseFloat(adj.amount) || 0 : 0,
        isAdjustment: true,
        remarks: adj.remarks
      }));

      // Combine and sort all transactions
      const allTransactions = [...tokenTransactions, ...expenseTransactions, ...adjustmentTransactions]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Filter current month transactions
      const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      });

      // Add pending balance to current month transactions
      const currentMonthTransactionsWithBalance = currentMonthTransactions.map((transaction) => ({
        ...transaction,
        pendingBalance: transaction.type === 'Pending' ? transaction.debit : 0
      }));

      // Filter previous transactions
      const previousTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < firstDayOfMonth;
      });

      // Combine all transactions with balance
      const transactionsWithBalance = [...previousTransactions, ...currentMonthTransactionsWithBalance];
      setTransactions(transactionsWithBalance);

    } catch (err) {
      setError('Failed to fetch transactions. Please try again.');
      console.error('Error fetching transactions:', err);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  // Memoize the debounced fetch function
  const debouncedFetch = useMemo(
    () => debounce((isRefresh) => fetchTransactions(isRefresh), 1000),
    [fetchTransactions]
  );

  // Process transactions for display
  const processedData = useMemo(() => {
    if (!transactions.length) return { filteredTransactions: [], categorySummary: [], monthlySummary: [] };
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Filter and sort current month transactions
    const currentMonthTransactions = transactions
      .filter(transaction => {
        if (!transaction?.date) return false;
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      })
      .sort((a, b) => {
        if (!a?.date || !b?.date) return 0;
        
        // Sort by date
        const dateA = new Date(a.date).toISOString().split('T')[0];
        const dateB = new Date(b.date).toISOString().split('T')[0];
        
        if (dateA !== dateB) {
          return new Date(dateA) - new Date(dateB);
        }
        
        // If same date, compare times if available
        const timeA = a.time || '00:00:00';
        const timeB = b.time || '00:00:00';
        
        if (timeA !== timeB) {
          return new Date(`${dateA}T${timeA}`) - new Date(`${dateB}T${timeB}`);
        }
        
        // If same time, sort by transaction type
        const typeOrder = { 'Income': 1, 'Expense': 2, 'Pending': 3 };
        if (a.type !== b.type) {
          return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
        }
        
        // If same type, sort by ID
        const idA = parseInt((a.id || '').replace(/\D/g, '') || '0');
        const idB = parseInt((b.id || '').replace(/\D/g, '') || '0');
        return idA - idB;
      });

    // Calculate running balance
    let runningBalance = cashInfo.openingBalance || 0;
    const transactionsWithBalance = currentMonthTransactions.map(transaction => {
      runningBalance = calculateBalance([transaction], runningBalance);
      return {
        ...transaction,
        runningBalance,
      };
    });

    // Process analytics data
    const { categories, monthly } = processTransactions(transactions, cashInfo);
    const totals = processTransactionTotals(transactionsWithBalance, cashInfo);

    // Update cash info with calculated totals
    const netChange = totals.totalIncome - totals.totalExpense;
    const closingBalance = (cashInfo.openingBalance || 0) + netChange;
    const totalPending = (cashInfo.openingPending || 0) + (totals.totalPending || 0);

    setCashInfo(prev => ({
      ...prev,
      ...totals,
      netChange,
      closingBalance,
      totalPending
    }));

    return {
      filteredTransactions: transactionsWithBalance,
      categorySummary: categories,
      monthlySummary: monthly
    };
  }, [transactions, cashInfo.openingBalance, cashInfo.openingPending]);

  return {
    transactions: processedData.filteredTransactions,
    categorySummary: processedData.categorySummary,
    monthlySummary: processedData.monthlySummary,
    cashInfo,
    loading: isInitialLoading || loading,
    error,
    isRefreshing,
    fetchTransactions,
    debouncedFetch
  };
};
