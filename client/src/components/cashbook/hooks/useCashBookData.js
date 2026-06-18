import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import apiService from '../../../services/api';
import cashAdjustmentService from '../../../services/cashAdjustmentService';
import { processTransactionTotals } from '../utils/transactionUtils';


export const useCashBookData = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cashInfo, setCashInfo] = useState({
    openingBalance: 0,
    openingPending: 0,
    previousPendingTokenIds: [],
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0,
    totalOutstandingPending: 0,
    paidPendingIncome: 0,
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
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const firstDayFormatted = formatDate(firstDayOfMonth);
      const lastDayFormatted = formatDate(lastDayOfMonth);
      
      const api = await apiService.getApi();

      // Fetch opening balance (all data before current month) and current month transactions in parallel
      const [openingBalanceResponse, tokensResponse, expensesResponse, adjustments] = await Promise.all([
        api.get('/api/cashbook/opening-balance', {
          params: {
            before_date: firstDayFormatted
          }
        }),
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

      // Extract opening balance data from backend
      const openingData = openingBalanceResponse.data.data;
      const { openingBalance, openingPending, previousPendingTokenIds } = openingData;

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
        particulars: `${expense.expense_name || expense.expense_type} - ${expense.paid_to || 'N/A'}`,
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

      // Filter current month transactions - using date string comparison to avoid timezone issues
      const currentMonthTransactions = allTransactions.filter(transaction => {
        if (!transaction?.date) return false;
        // Compare dates as strings (YYYY-MM-DD) to avoid timezone issues
        const transactionDateStr = transaction.date.slice(0, 10);
        return transactionDateStr >= firstDayFormatted && transactionDateStr <= lastDayFormatted;
      });

      setTransactions(currentMonthTransactions);

      // Process current month transaction totals
      const totals = processTransactionTotals(currentMonthTransactions, { previousPendingTokenIds });

      // Net Change = totalIncome - totalExpense
      // Pending is informational only - does not affect the balance
      const netChange = totals.totalIncome - totals.totalExpense;
      const closingBalance = openingBalance + netChange;

      // Update cash info with opening balance and current month totals
      setCashInfo({
        openingBalance,
        openingPending,
        previousPendingTokenIds,
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        totalPending: totals.totalPending,
        totalOutstandingPending: openingPending + totals.totalPending,
        paidPendingIncome: totals.paidPendingIncome,
        netChange,
        closingBalance
      });

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
    
    // Return transactions without any calculations
    return {
      filteredTransactions: transactions,
      categorySummary: [],
      monthlySummary: []
    };
  }, [transactions]);

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
