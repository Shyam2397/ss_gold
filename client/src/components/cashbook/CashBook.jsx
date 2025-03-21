import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, FileSpreadsheet, Printer, Mail, X } from 'lucide-react';
import CashAdjustment from './CashAdjustment';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CashBook({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [cashInfo, setCashInfo] = useState({
    openingBalance: 0,
    closingBalance: 0
  });
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Get current month dates
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Calculate first and last day of current month
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // Calculate first and last day of previous month for opening balance
      const firstDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfPreviousMonth = new Date(currentYear, currentMonth, 0);
      
      // Format dates for API
      const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
      const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];
      const firstDayOfAllTime = new Date(2000, 0, 1).toISOString().split('T')[0]; // Start from a very early date
      const lastDayOfPreviousMonthFormatted = lastDayOfPreviousMonth.toISOString().split('T')[0];
      
      console.log('Date ranges for opening balance:', {
        from: firstDayOfAllTime,
        to: lastDayOfPreviousMonth
      });
      
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
      
      // Calculate opening balance from previous transactions (up to last month)
      const previousIncome = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return sum + parseFloat(token.amount || 0);
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
      
      console.log('Opening Balance Calculation:', {
        previousIncome,
        previousExpenses,
        openingBalance,
        calculatedForMonth: lastDayOfPreviousMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        upToDate: lastDayOfPreviousMonthFormatted
      });
      
      // Update opening balance in cashInfo
      setCashInfo(prev => ({ ...prev, openingBalance }));
      
      // 2. Fetch current month transactions to display
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

      // Transform tokens into transactions (Income)
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
        isPaid: token.isPaid
      }));

      // Transform expenses into transactions (Expense)
      const expenseTransactions = expensesResponse.data.map(expense => ({
        id: `expense-${expense.id}`,
        date: expense.date,
        particulars: `${expense.expense_type} - ${expense.paid_to || 'N/A'}`,
        type: 'Expense',
        debit: parseFloat(expense.amount) || 0,
        credit: 0
      }));

      // Combine and sort transactions by date (ascending for running balance)
      const allTransactions = [...tokenTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Only process current month transactions for running balance
      const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      });

      // Calculate running balance starting with opening balance
      let runningBalance = openingBalance;
      console.log('Starting running balance calculation with opening balance:', openingBalance);
      
      const currentMonthTransactionsWithBalance = currentMonthTransactions.map(transaction => {
        // For each transaction, update running balance by adding credit and subtracting debit
        const transactionAmount = (parseFloat(transaction.credit) || 0) - (parseFloat(transaction.debit) || 0);
        runningBalance += transactionAmount;
        console.log(`Transaction: ${transaction.particulars}, Date: ${transaction.date}, Credit: ${transaction.credit}, Debit: ${transaction.debit}, Amount: ${transactionAmount}, New Balance: ${runningBalance}`);
        return {
          ...transaction,
          runningBalance
        };
      });

      // Combine with previous transactions (without running balance)
      const previousTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < firstDayOfMonth;
      });

      const transactionsWithBalance = [...previousTransactions, ...currentMonthTransactionsWithBalance];

      setTransactions(transactionsWithBalance);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // Set up polling for real-time updates
    const pollInterval = setInterval(() => {
      fetchTransactions();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    // Filter transactions to show only current month transactions
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Filter transactions to only include current month
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
    });
    
    // Sort transactions by date for consistent display
    const sortedTransactions = [...currentMonthTransactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    
    setFilteredTransactions(sortedTransactions);

    // Calculate net change for current month (simplified from previous cashflow calculation)
    const netChange = sortedTransactions.reduce(
      (acc, curr) => acc + ((curr.credit || 0) - (curr.debit || 0)),
      0
    );
    
    // Set cash info with correct opening and closing balance only
    setCashInfo(prev => {
      const closingBalance = prev.openingBalance + netChange;
      
      console.log('Balance Calculation Summary:', {
        month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        openingBalance: prev.openingBalance,
        netChange,
        closingBalance
      });
      
      return {
        openingBalance: prev.openingBalance, // Keep the original opening balance
        closingBalance: closingBalance
      };
    });
  }, [transactions]);

  // Search, reset, and quick filter functions removed as per requirement

  const handleExport = (type) => {
    switch(type) {
      case 'excel':
        console.log('Exporting to Excel...');
        break;
      case 'print':
        window.print();
        break;
      case 'email':
        console.log('Preparing email...');
        break;
      default:
        break;
    }
  };

  const handleAdjustmentSave = async (adjustmentData) => {
    setLoading(true);
    try {
      // Convert adjustment to transaction format for UI
      const transaction = {
        id: `adjustment-${Date.now()}`,
        date: adjustmentData.date,
        particulars: adjustmentData.remarks || 'Cash Adjustment',
        type: adjustmentData.type === 'credit' ? 'Income' : 'Expense',
        debit: adjustmentData.type === 'debit' ? adjustmentData.amount : 0,
        credit: adjustmentData.type === 'credit' ? adjustmentData.amount : 0,
        isAdjustment: true
      };

      // Save adjustment to backend - this ensures it's included in future opening balance calculations
      // We'll save it as an expense with negative amount for debit or as a token for credit
      if (adjustmentData.type === 'debit') {
        // Save as expense
        await axios.post(`${API_BASE_URL}/api/expenses`, {
          date: adjustmentData.date,
          expense_type: 'Cash Adjustment',
          paid_to: adjustmentData.remarks || 'Cash Adjustment',
          amount: adjustmentData.amount,
          payment_mode: 'Cash',
          remarks: 'Manual cash adjustment'
        });
      } else {
        // Save as token/income
        await axios.post(`${API_BASE_URL}/tokens`, {
          date: adjustmentData.date,
          tokenNo: `ADJ-${Date.now()}`,
          name: adjustmentData.remarks || 'Cash Adjustment',
          amount: adjustmentData.amount,
          payment_mode: 'Cash',
          remarks: 'Manual cash adjustment'
        });
      }

      // Add to local transactions and refresh data
      setTransactions(prev => [...prev, transaction]);
      // Refresh all transactions to ensure consistency
      fetchTransactions();
      setShowAdjustment(false);
    } catch (err) {
      console.error('Error saving adjustment:', err);
      setError('Failed to save adjustment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        className="bg-white rounded-2xl shadow-2xl w-[92vw] max-w-7xl max-h-[92vh] overflow-hidden flex flex-col transition-transform duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm z-20">
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center p-4">{error}</div>
        )}
        {!loading && !error && transactions.length === 0 && (
          <div className="text-gray-500 text-center p-4">No transactions found</div>
        )}
          {/* Actions */}
          <div className="p-4 flex justify-end border-b bg-white sticky top-0 z-10">
            <button 
              onClick={() => setShowAdjustment(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowUpDown size={16} />
              Cash Adjustments
            </button>
          </div>

          {/* Main Content */}
          <div className="p-4 flex gap-4">
            {/* Table Section */}
            <div className="flex-1">
              <div className="border rounded-xl">
                <div className="bg-amber-50 px-4 py-2 border-b">
                  <h3 className="font-medium text-amber-800">
                    {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Transactions
                  </h3>
                </div>
                <div className="h-[calc(90vh-280px)]">
                <AutoSizer>
                  {({ width, height }) => (
                    <Table
                      width={width}
                      height={height}
                      headerHeight={32}
                      rowHeight={40}
                      rowCount={filteredTransactions.length + 2}
                      rowGetter={({ index }) => {
                        if (index === 0) return { type: 'opening' };
                        if (index === filteredTransactions.length + 1) return { type: 'closing' };
                        return filteredTransactions[index - 1];
                      }}
                      rowClassName={({ index }) => 
                        `${index === -1 ? 'bg-amber-500' : 
                          index === 0 ? 'bg-amber-50/80 font-medium' :
                          index === filteredTransactions.length + 1 ? 'bg-amber-50/80 font-medium' :
                          index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'} 
                         ${index !== -1 && index !== 0 && index !== filteredTransactions.length + 1 ? 'hover:bg-amber-50/70' : ''} 
                         transition-colors rounded-t-xl`
                      }
                      overscanRowCount={5}
                    >
                      <Column
                        label="Date"
                        dataKey="date"
                        width={120}
                        headerRenderer={({ label }) => (
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-1.5">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-center text-xs text-amber-900 truncate py-2.5">
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
                        )}
                      />
                      <Column
                        label="Particulars"
                        dataKey="particulars"
                        width={300}
                        flexGrow={1}
                        headerRenderer={({ label }) => (
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-1.5">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => {
                          if (rowData.type === 'opening' || rowData.type === 'closing') {
                            return (
                              <div className="text-xs text-amber-900 truncate py-2.5 px-4">
                                {rowData.particulars || '-'}
                              </div>
                            );
                          }
                          
                          if (rowData.particulars.test) { // For token transactions
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
                          
                          return ( // For expense transactions
                            <div className="text-xs text-amber-900 truncate py-2.5 px-4">
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-1.5">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-center text-xs truncate py-2.5">
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-1.5">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-right text-xs text-amber-900 truncate py-2.5 px-4">
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-1.5">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-right text-xs text-amber-900 truncate py-2.5 px-4">
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-1.5">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-right text-xs truncate py-2.5 px-4 font-medium">
                            {rowData.type === 'opening' ? (
                              <span className="font-semibold text-amber-700">
                                ₹ {cashInfo.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : rowData.type === 'closing' ? (
                              <span className="font-semibold text-amber-700">
                                ₹ {cashInfo.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className={rowData.runningBalance >= 0 ? "text-green-700" : "text-red-700"}>
                                ₹ {rowData.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </Table>
                  )}
                </AutoSizer>
                </div>
              </div>
            </div>

            {/* Balance Info Section */}
            <div className="w-72">
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="p-4 border-b bg-amber-50/50">
                  <h3 className="font-medium text-amber-800 flex items-center gap-2">
                    <span className="text-amber-500">☀</span> 
                    Balance Summary
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Opening Balance</span>
                    <span className="text-sm font-medium text-gray-700">₹ {cashInfo.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Net Change</span>
                    <span className="text-sm font-medium text-gray-700">
                      <span className={cashInfo.closingBalance - cashInfo.openingBalance >= 0 ? "text-green-600" : "text-red-600"}>
                        {cashInfo.closingBalance - cashInfo.openingBalance >= 0 ? "+" : ""}
                        ₹ {(cashInfo.closingBalance - cashInfo.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Closing Balance</span>
                    <span className="text-sm font-medium text-amber-600">₹ {cashInfo.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="mt-3">
                <div className="bg-white border rounded-xl overflow-hidden">
                  <div className="flex">
                    <button 
                      onClick={() => setActiveTab('categorywise')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
                        ${activeTab === 'categorywise' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      Category
                    </button>
                    <button 
                      onClick={() => setActiveTab('monthwise')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
                        ${activeTab === 'monthwise' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      Monthly
                    </button>
                  </div>
                  <div className="p-4">
                    {activeTab === 'categorywise' ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Supplies</span>
                          <span className="text-sm font-medium text-gray-700">₹ 1,000.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sales</span>
                          <span className="text-sm font-medium text-gray-700">₹ 5,000.00</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">January 2025</span>
                          <span className="text-sm font-medium text-gray-700">₹ 4,000.00</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-4 py-3 flex justify-between items-center bg-white sticky bottom-0 shadow-sm">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2 text-xs text-gray-500">
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

export default CashBook;