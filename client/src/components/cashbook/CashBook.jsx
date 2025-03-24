import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowUpDown, FileSpreadsheet, Printer, Mail, X } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { debounce } from 'lodash';
import TransactionTable from './components/TransactionTable';
import AnalyticsPanel from './components/AnalyticsPanel';
import CashAdjustment from './CashAdjustment';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CashBook({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [cashInfo, setCashInfo] = useState({
    openingBalance: 0,
    openingPending: 0
  });
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [categorySummary, setCategorySummary] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const rowGetter = useCallback(({ index }) => {
    if (index === 0) return { type: 'opening' };
    if (index === filteredTransactions.length + 1) return { type: 'closing' };
    return filteredTransactions[index - 1];
  }, [filteredTransactions]);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError('');
    try {// Get current month dates

// Get current month dates
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();// Calculate first and last day of current month

      
// Calculate first and last day of current month
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const firstDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfPreviousMonth = new Date(currentYear, currentMonth, 0);
      
      const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
      const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];
      const firstDayOfAllTime = new Date(2000, 0, 1).toISOString().split('T')[0];
      const lastDayOfPreviousMonthFormatted = lastDayOfPreviousMonth.toISOString().split('T')[0];
      
      const [previousTokensResponse, previousExpensesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/tokens`, {
          params: {
            from_date: firstDayOfAllTime,
            to_date: lastDayOfPreviousMonth
          }
        }),
        axios.get(`${API_BASE_URL}/api/expenses`, {
          params: {
            from_date: firstDayOfAllTime,
            to_date: lastDayOfPreviousMonth
          }
        })
      ]);
      
      const previousIncome = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return token.isPaid ? sum + parseFloat(token.amount || 0) : sum;
        }
        return sum;
      }, 0);
      
      const previousPending = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return !token.isPaid ? sum + parseFloat(token.amount || 0) : sum;
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
      
      const openingBalance = previousIncome - previousExpenses;
      const openingPending = previousPending;
      
      setCashInfo(prev => ({ 
        ...prev, 
        openingBalance,
        openingPending
      }));
      
      const [tokensResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/tokens`, {
          params: {
            from_date: firstDayFormatted,
            to_date: lastDayFormatted
          }
        }),
        axios.get(`${API_BASE_URL}/api/expenses`, {
          params: {
            from_date: firstDayFormatted,
            to_date: lastDayFormatted
          }
        })
      ]);

      const tokenTransactions = tokensResponse.data.map(token => ({
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

      const expenseTransactions = expensesResponse.data.map(expense => ({
        id: `expense-${expense.id}`,
        date: expense.date,
        particulars: `${expense.expense_type} - ${expense.paid_to || 'N/A'}`,
        type: 'Expense',
        debit: parseFloat(expense.amount) || 0,
        credit: 0
      }));

      const allTransactions = [...tokenTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      });

      const currentMonthTransactionsWithBalance = currentMonthTransactions.map((transaction) => {
        return {
          ...transaction,
          pendingBalance: transaction.type === 'Pending' ? transaction.debit : 0
        };
      });

      const previousTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < firstDayOfMonth;
      });

      const transactionsWithBalance = [...previousTransactions, ...currentMonthTransactionsWithBalance];

      setTransactions(transactionsWithBalance);
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

  const debouncedFetch = useMemo(
    () => debounce((isRefresh) => fetchTransactions(isRefresh), 1000),
    [fetchTransactions]
  );

  useEffect(() => {
    fetchTransactions();
    const pollInterval = setInterval(() => {
      debouncedFetch(true);
    }, 30000);
    return () => {
      clearInterval(pollInterval);
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  const memoizedFilteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const currentMonthTransactions = transactions
      .filter(transaction => {
        if (!transaction?.date) return false;
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      })
      .sort((a, b) => {
        if (!a?.date || !b?.date) return 0;
        
        // Convert dates to ISO string for consistent timezone handling
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
    return currentMonthTransactions.map(transaction => {
      if (transaction.type === 'Income') {
        runningBalance += transaction.credit || 0;
      } else if (transaction.type === 'Expense') {
        runningBalance -= transaction.debit || 0;
      }
      return { ...transaction, runningBalance };
    });
  }, [transactions]);

  useEffect(() => {
    setFilteredTransactions(memoizedFilteredTransactions);
  }, [memoizedFilteredTransactions]);

  const memoizedAnalytics = useMemo(() => {
    const categories = memoizedFilteredTransactions.reduce((acc, curr) => {
      if (curr?.type === 'Expense' && curr?.particulars) {
        const category = typeof curr.particulars === 'string' 
          ? curr.particulars.split(' - ')[0]
          : 'Other';
        if (!acc[category]) acc[category] = 0;
        acc[category] += curr.debit || 0;
      }
      return acc;
    }, {});

    const sortedCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        income: 0,
        expense: 0,
        pending: 0
      };
    });

    transactions.forEach(transaction => {
      if (!transaction?.date) return;
      
      const transDate = new Date(transaction.date);
      const monthKey = transDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const monthData = monthlyData.find(m => m.month === monthKey);
      
      if (monthData && transaction?.type) {
        if (transaction.type === 'Income') monthData.income += transaction.credit || 0;
        else if (transaction.type === 'Expense') monthData.expense += transaction.debit || 0;
        else if (transaction.type === 'Pending') monthData.pending += transaction.debit || 0;
      }
    });

    return { categories: sortedCategories, monthly: monthlyData };
  }, [memoizedFilteredTransactions, transactions]);

  useEffect(() => {
    setCategorySummary(memoizedAnalytics.categories);
    setMonthlySummary(memoizedAnalytics.monthly);
  }, [memoizedAnalytics]);

  const handleExport = useCallback((type) => {
    switch(type) {
      case 'excel':
      case 'print':
        window.print();
        break;
      case 'email':
        break;
      default:
        break;
    }
  }, []);

  const handleAdjustmentSave = useCallback(async (adjustmentData) => {
    setLoading(true);
    try {
      const transaction = {
        id: `adjustment-${Date.now()}`,
        date: adjustmentData.date,
        particulars: adjustmentData.remarks || 'Cash Adjustment',
        type: adjustmentData.type === 'credit' ? 'Income' : 'Expense',
        debit: adjustmentData.type === 'debit' ? adjustmentData.amount : 0,
        credit: adjustmentData.type === 'credit' ? adjustmentData.amount : 0,
        isAdjustment: true
      };

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

      setTransactions(prev => [...prev, transaction]);
      fetchTransactions();
      setShowAdjustment(false);
    } catch (err) {
      setError('Failed to save adjustment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-[95vw] md:w-[92vw] max-w-7xl max-h-[95vh] md:max-h-[92vh] overflow-hidden flex flex-col transition-transform duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 md:px-7 py-2 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Cash Book</h1>
            <span className="text-sm px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium ring-1 ring-amber-100/50">Report</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          {isRefreshing && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <p className="text-sm text-amber-600">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
              <div className="text-red-500 text-center">
                <p className="text-lg font-medium">Error loading transactions</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={() => fetchTransactions()}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
              <div className="text-gray-500 text-center">
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm mt-1">There are no transactions recorded for this period.</p>
              </div>
            </div>
          ) : (
            <div className="py-2 md:py-4 px-4 flex flex-col lg:flex-row gap-3 md:gap-4">
              <div className="flex-1 order-2 lg:order-1">
                <div className="border rounded-xl">
                  <div className="bg-amber-50 px-4 py-2 border-b">
                    <h3 className="font-medium text-amber-800">
                      {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Transactions
                    </h3>
                  </div>
                  <TransactionTable
                    filteredTransactions={filteredTransactions}
                    cashInfo={cashInfo}
                    rowGetter={rowGetter}
                  />
                </div>
              </div>
              
              <div className="w-full lg:w-64 space-y-3 order-1 lg:order-2">
                <button 
                  onClick={() => setShowAdjustment(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowUpDown size={16} />
                  Cash Adjustments
                </button>
                <AnalyticsPanel
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  categorySummary={categorySummary}
                  monthlySummary={monthlySummary}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-3 md:px-4 py-2 md:py-3 flex justify-between items-center bg-white sticky bottom-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => handleExport('excel')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors">
              <FileSpreadsheet size={16} />
              Excel
            </button>
            <button onClick={() => handleExport('print')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors">
              <Printer size={16} />
              Print
            </button>
            <button onClick={() => handleExport('email')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors">
              <Mail size={16} />
              Email
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-full">Limited Version</span>
          </div>
        </div>
      </motion.div>
      <CashAdjustment 
        isOpen={showAdjustment}
        onClose={() => setShowAdjustment(false)}
        onSave={handleAdjustmentSave}
      />
    </motion.div>
  );
}

export default React.memo(CashBook);