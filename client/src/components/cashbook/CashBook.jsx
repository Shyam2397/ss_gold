import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowUpDown, FileSpreadsheet, Printer, Mail, X } from 'lucide-react';
import CashAdjustment from './CashAdjustment';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CashBook({ isOpen, onClose }) {
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

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const getRowStyle = useCallback(({ index }) => {
    return {
      backgroundColor: 
        index === 0 ? 'rgb(255, 251, 235)' :
        index === filteredTransactions.length + 1 ? 'rgb(255, 251, 235)' :
        index % 2 === 0 ? '#fff' : 'rgba(255, 251, 235, 0.4)'
    };
  }, [filteredTransactions.length]);

  const rowGetter = useCallback(({ index }) => {
    if (index === 0) return { type: 'opening' };
    if (index === filteredTransactions.length + 1) return { type: 'closing' };
    return filteredTransactions[index - 1];
  }, [filteredTransactions]);

  const DateCell = useCallback(({ rowData }) => (
    <div className="text-center text-xs text-amber-900 truncate py-3.5 px-4">
      {rowData.type === 'opening' ? (
        <span className="font-semibold">Opening Balance</span>
      ) : rowData.type === 'closing' ? (
        <span className="font-semibold">Closing Balance</span>
      ) : (
        new Date(rowData.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      )}
    </div>
  ), []);
  
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

      let runningBalance = openingBalance;
      let runningPending = openingPending;
      
      const currentMonthTransactionsWithBalance = currentMonthTransactions.map(transaction => {
        if (transaction.type === 'Pending') {
          runningPending += transaction.debit;
          return {
            ...transaction,
            runningBalance,
            pendingBalance: runningPending
          };
        } else {
          const transactionAmount = (transaction.credit || 0) - (transaction.debit || 0);
          runningBalance += transactionAmount;
          return {
            ...transaction,
            runningBalance,
            pendingBalance: runningPending
          };
        }
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
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const currentMonthTransactions = transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        const timeA = a.time ? new Date(`${a.date}T${a.time}`) : new Date(a.date);
        const timeB = b.time ? new Date(`${b.date}T${b.time}`) : new Date(b.date);
        if (timeA.getTime() !== timeB.getTime()) {
          return timeA.getTime() - timeB.getTime();
        }
        
        const idA = parseInt((a.id || '').replace(/\D/g, '') || '0');
        const idB = parseInt((b.id || '').replace(/\D/g, '') || '0');
        return idA - idB;
      });

    return currentMonthTransactions;
  }, [transactions]);

  useEffect(() => {
    setFilteredTransactions(memoizedFilteredTransactions);
  }, [memoizedFilteredTransactions]);

  const memoizedCashInfo = useMemo(() => {
    const totals = memoizedFilteredTransactions.reduce((acc, curr) => {
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
    const totalPending = cashInfo.openingPending + totals.totalPending;
    
    return {
      openingBalance: cashInfo.openingBalance,
      openingPending: cashInfo.openingPending,
      ...totals,
      totalPending,
      netChange,
      closingBalance: cashInfo.openingBalance + netChange
    };
  }, [memoizedFilteredTransactions, cashInfo.openingBalance, cashInfo.openingPending]);

  useEffect(() => {
    setCashInfo(memoizedCashInfo);
  }, [memoizedCashInfo]);

  const memoizedAnalytics = useMemo(() => {
    const categories = memoizedFilteredTransactions.reduce((acc, curr) => {
      if (curr.type === 'Expense') {
        const category = curr.particulars.split(' - ')[0];
        if (!acc[category]) acc[category] = 0;
        acc[category] += curr.debit;
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
      const transDate = new Date(transaction.date);
      const monthKey = transDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const monthData = monthlyData.find(m => m.month === monthKey);
      
      if (monthData) {
        if (transaction.type === 'Income') monthData.income += transaction.credit;
        else if (transaction.type === 'Expense') monthData.expense += transaction.debit;
        else if (transaction.type === 'Pending') monthData.pending += transaction.debit;
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
            <>
              <div className="py-2 md:py-4 px-4 flex flex-col lg:flex-row gap-3 md:gap-4">
                <div className="flex-1 order-2 lg:order-1">
                  <div className="border rounded-xl">
                    <div className="bg-amber-50 px-4 py-2 border-b">
                      <h3 className="font-medium text-amber-800">
                        {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Transactions
                      </h3>
                    </div>
                    <div className="h-[65vh] lg:h-[calc(93vh-190px)]">
                      <AutoSizer>
                        {({ width, height }) => (
                          <Table
                            width={width}
                            height={height}
                            headerHeight={32}
                            rowHeight={40}
                            rowCount={filteredTransactions.length + 2}
                            rowGetter={rowGetter}
                            overscanRowCount={5}
                            scrollToIndex={0}
                            estimatedRowSize={48}
                            defaultHeight={450}
                            rowClassName={({ index }) => 
                              `${index === -1 
                                ? 'bg-amber-500' 
                                : index === 0 || index === filteredTransactions.length + 1
                                ? 'bg-amber-50 hover:bg-amber-100/40'
                                : index % 2 === 0 
                                ? 'bg-white hover:bg-amber-100/40' 
                                : 'bg-amber-50/40 hover:bg-amber-100/40'
                            } transition-colors text-amber-900 text-xs font-medium rounded`
                            }
                        >
                          <Column
                            label="Date"
                            dataKey="date"
                            width={100}
                            flexShrink={0}
                            headerRenderer={({ label }) => (
                              <div className="text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center">
                                {label}
                              </div>
                            )}
                            cellRenderer={DateCell}
                          />
                            <Column
                              label="Particulars"
                              dataKey="particulars"
                              width={300}
                              flexGrow={1}
                              headerRenderer={({ label }) => (
                                <div className="text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center pointer-events-none">
                                  {label}
                                </div>
                              )}
                              cellRenderer={({ rowData }) => {
                                if (rowData.type === 'opening' || rowData.type === 'closing') {
                                  return (
                                    <div className="text-xs text-amber-900 truncate py-3.5 px-4">
                                      {rowData.particulars || '-'}
                                    </div>
                                  );
                                }
                                
                                if (rowData.particulars.test) {
                                  return (
                                    <div className="text-xs text-amber-900 truncate py-2.5 px-4 flex items-center gap-1.5">
                                      <span className="font-medium">{rowData.particulars.test}</span>
                                      <span className="text-[10px] text-amber-600">•</span>
                                      <span className="text-[10px] text-amber-800">#{rowData.particulars.tokenNo}</span>
                                      <span className="text-[10px] text-amber-600">•</span>
                                      <span className="text-[10px] text-amber-500">{rowData.particulars.name.substring(0, 15)}{rowData.particulars.name.length > 15 ? '...' : ''}</span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="text-xs text-amber-900 truncate py-3.5 px-4">
                                    {rowData.particulars}
                                  </div>
                                );
                              }}
                            />
                            <Column
                              label="Type"
                              dataKey="type"
                              width={120}
                              headerRenderer={({ label }) => (
                                <div className="text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center pointer-events-none">
                                  {label}
                                </div>
                              )}
                              cellRenderer={({ rowData }) => (
                                <div className="text-center text-xs truncate py-3.5 px-4">
                                  {rowData.type === 'opening' || rowData.type === 'closing' ? '' :
                                  <span className={`px-2.5 py-0.5 rounded-full font-medium inline-block
                                    ${rowData.type === 'Income' ? 'bg-green-100 text-green-800' : 
                                      rowData.type === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'}`}>
                                    {rowData.type}
                                  </span>}
                                </div>
                              )}
                            />
                            <Column
                              label="Debit"
                              dataKey="debit"
                              width={120}
                              headerRenderer={({ label }) => (
                                <div className="text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center justify-end">
                                  {label}
                                </div>
                              )}
                              cellRenderer={({ rowData }) => (
                                <div className="text-right text-xs text-amber-900 truncate py-3.5 px-4">
                                  {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
                                   rowData.debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            />
                            <Column
                              label="Credit"
                              dataKey="credit"
                              width={120}
                              headerRenderer={({ label }) => (
                                <div className="text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center justify-end">
                                  {label}
                                </div>
                              )}
                              cellRenderer={({ rowData }) => (
                                <div className="text-right text-xs text-amber-900 truncate py-3.5 px-4">
                                  {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
                                   rowData.credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            />
                            <Column
                              label="Balance"
                              dataKey="runningBalance"
                              width={120}
                              headerRenderer={({ label }) => (
                                <div className="text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center justify-end">
                                  {label}
                                </div>
                              )}
                              cellRenderer={({ rowData }) => {
                                if (rowData.type === 'opening') {
                                  return (
                                    <div className="text-right text-xs py-3.5 px-4">
                                      <div className="font-medium text-amber-700">
                                        ₹ {cashInfo.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </div>
                                      {cashInfo.openingPending > 0 && (
                                        <div className="text-[10px] text-yellow-600 mt-0.5">
                                          Pending: ₹ {cashInfo.openingPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                
                                if (rowData.type === 'closing') {
                                  return (
                                    <div className="text-right text-xs py-2.5 px-4 font-medium text-amber-700">
                                      ₹ {cashInfo.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="text-right text-xs py-3.5 px-4">
                                    <span className={`font-medium ${rowData.runningBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                                      ₹ {rowData.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                          </Table>
                        )}
                      </AutoSizer>
                    </div>
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

                  <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="py-0.5 px-3 md:py-1.5 border-b bg-amber-500">
                      <h3 className="text-sm font-medium text-white">Balance Summary</h3>
                    </div>
                    <div className="py-1 px-3 md:py-1.5 space-y-2 text-xs">
                      <div className="space-y-1 pb-2 border-b">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Opening Balance</span>
                          <span className="font-medium text-gray-700">
                            ₹ {cashInfo.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {cashInfo.openingPending > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Opening Pending</span>
                            <span className="font-medium text-yellow-600">
                              ₹ {cashInfo.openingPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Income</span>
                          <span className="font-medium text-green-600">
                            +₹ {cashInfo.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Expense</span>
                          <span className="font-medium text-red-600">
                            -₹ {cashInfo.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Net Change</span>
                          <span className={`font-medium ${cashInfo.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {cashInfo.netChange >= 0 ? '+' : ''}
                            ₹ {cashInfo.netChange.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {cashInfo.totalPending > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Pending</span>
                            <span className="font-medium text-yellow-600">
                              ₹ {cashInfo.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 mt-1 border-t">
                        <span className="font-medium text-gray-700">Closing Balance</span>
                        <span className="font-medium text-amber-600">
                          ₹ {cashInfo.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="flex border-b">
                      <button 
                        onClick={() => setActiveTab('categorywise')}
                        className={`flex-1 px-4 py-1 text-xs font-medium transition-colors relative
                          ${activeTab === 'categorywise' ? 'text-amber-800' : 'text-gray-600'}`}
                      >
                        Top Expenses
                        {activeTab === 'categorywise' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
                        )}
                      </button>
                      <button 
                        onClick={() => setActiveTab('monthwise')}
                        className={`flex-1 px-4 py-1 text-xs font-medium transition-colors relative
                          ${activeTab === 'monthwise' ? 'text-amber-800' : 'text-gray-600'}`}
                      >
                        Monthly Overview
                        {activeTab === 'monthwise' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
                        )}
                      </button>
                    </div>

                    <div className="max-h-[170px] md:max-h-[170px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-gray-50">
                      {activeTab === 'categorywise' ? (
                        <div className="divide-y">
                          {categorySummary.map(([category, amount], index) => (
                            <div key={category} className="p-3 hover:bg-amber-50/30">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">{category}</span>
                                <span className="text-xs font-medium text-red-600">
                                  ₹ {amount.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-400 rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${(amount / categorySummary[0][1]) * 100}%`,
                                    opacity: 1 - (index * 0.15)
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="divide-y">
                          {monthlySummary.map((data) => (
                            <div key={data.month} className="p-3 hover:bg-amber-50/30">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-gray-700">{data.month}</span>
                                <span className={`text-xs font-medium ${
                                  data.income - data.expense >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {data.income - data.expense >= 0 ? '+' : ''}
                                  ₹ {(data.income - data.expense).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="flex gap-3 text-[10px]">
                                <span className="text-green-600">+₹ {data.income.toLocaleString('en-IN')}</span>
                                <span className="text-red-600">-₹ {data.expense.toLocaleString('en-IN')}</span>
                                {data.pending > 0 && (
                                  <span className="text-yellow-600">
                                    ₹ {data.pending.toLocaleString('en-IN')} pending
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex gap-0.5 h-1">
                                <div className="bg-green-400 rounded-l" style={{ width: `${(data.income / (data.income + data.expense)) * 100}%` }} />
                                <div className="bg-red-400 rounded-r" style={{ width: `${(data.expense / (data.income + data.expense)) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
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