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
    inflow: 0,
    outflow: 0,
    netFlow: 0,
    openingBalance: 0,
    closingBalance: 0,
    previousMonthBalance: 0
  });
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);

  const fetchPreviousMonthBalance = async () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfPreviousMonth = new Date(firstDayOfMonth);
    lastDayOfPreviousMonth.setDate(0);

    try {
      const [tokensResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/tokens`, {
          params: {
            from_date: lastDayOfPreviousMonth.toISOString().split('T')[0],
            to_date: lastDayOfPreviousMonth.toISOString().split('T')[0]
          }
        }),
        axios.get(`${API_BASE_URL}/api/expenses`, {
          params: {
            from_date: lastDayOfPreviousMonth.toISOString().split('T')[0],
            to_date: lastDayOfPreviousMonth.toISOString().split('T')[0]
          }
        })
      ]);

      const previousMonthIncome = tokensResponse.data.reduce((sum, token) => sum + parseFloat(token.amount), 0);
      const previousMonthExpenses = expensesResponse.data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const previousMonthBalance = previousMonthIncome - previousMonthExpenses;

      setCashInfo(prev => ({...prev, previousMonthBalance, openingBalance: previousMonthBalance}));
    } catch (err) {
      console.error('Error fetching previous month balance:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both tokens and expenses without date filtering
      const [tokensResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/tokens`),
        axios.get(`${API_BASE_URL}/api/expenses`)
      ]);

      // Transform tokens into transactions (Income)
      const tokenTransactions = tokensResponse.data.map(token => ({
        id: `token-${token.id}`,
        date: token.date,
        particulars: `Token #${token.tokenNo} - ${token.name}`,
        type: 'Income',
        debit: 0,
        credit: parseFloat(token.amount) || 0
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

      // Calculate running balance
      let runningBalance = cashInfo.openingBalance;
      const transactionsWithBalance = allTransactions.map(transaction => {
        runningBalance = runningBalance + transaction.credit - transaction.debit;
        return {
          ...transaction,
          runningBalance: runningBalance
        };
      });

      setTransactions(transactionsWithBalance);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviousMonthBalance();
    fetchTransactions();
    // Set up polling for real-time updates
    const pollInterval = setInterval(() => {
      fetchTransactions();
      fetchPreviousMonthBalance();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    setFilteredTransactions(transactions);

    const info = transactions.reduce((acc, curr) => ({
      inflow: acc.inflow + curr.credit,
      outflow: acc.outflow + curr.debit,
      netFlow: (acc.inflow + curr.credit) - (acc.outflow + curr.debit),
      openingBalance: cashInfo.openingBalance,
      closingBalance: cashInfo.openingBalance + (acc.inflow + curr.credit) - (acc.outflow + curr.debit)
    }), { 
      inflow: 0, 
      outflow: 0, 
      netFlow: 0, 
      openingBalance: cashInfo.openingBalance,
      closingBalance: cashInfo.openingBalance
    });
    setCashInfo(info);
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

  const handleAdjustmentSave = (adjustmentData) => {
    // Convert adjustment to transaction format
    const transaction = {
      id: Date.now(),
      date: adjustmentData.date,
      particulars: adjustmentData.remarks || 'Cash Adjustment',
      type: adjustmentData.type === 'credit' ? 'Income' : 'Expense',
      debit: adjustmentData.type === 'debit' ? adjustmentData.amount : 0,
      credit: adjustmentData.type === 'credit' ? adjustmentData.amount : 0,
      isAdjustment: true
    };

    setTransactions(prev => [...prev, transaction]);
    setShowAdjustment(false);
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
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <div className="text-2xl font-semibold text-amber-600 tracking-tight">₹ {cashInfo.netFlow.toFixed(2)}</div>
              <div className="text-xs text-gray-500 font-medium">Net Balance</div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
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
                <div className="h-[calc(90vh-280px)]">
                <AutoSizer>
                  {({ width, height }) => (
                    <Table
                      width={width}
                      height={height}
                      headerHeight={40}
                      rowHeight={50}
                      rowCount={filteredTransactions.length + 2}
                      rowGetter={({ index }) => {
                        if (index === 0) return { type: 'opening' };
                        if (index === filteredTransactions.length + 1) return { type: 'closing' };
                        return filteredTransactions[index - 1];
                      }}
                      rowClassName={({ index }) => 
                        `${index === -1 ? 'bg-amber-500' : 
                          index === 0 || index === filteredTransactions.length + 1 ? 'bg-amber-50/50' :
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-center text-xs text-amber-900 truncate py-4">
                            {rowData.type === 'opening' ? 'Opening Balance' :
                             rowData.type === 'closing' ? 'Closing Balance' :
                             rowData.date}
                          </div>
                        )}
                      />
                      <Column
                        label="Particulars"
                        dataKey="particulars"
                        width={300}
                        flexGrow={1}
                        headerRenderer={({ label }) => (
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-xs text-amber-900 truncate py-4 px-4">
                            {rowData.particulars || '-'}
                          </div>
                        )}
                      />
                      <Column
                        label="Type"
                        dataKey="type"
                        width={120}
                        headerRenderer={({ label }) => (
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-center text-xs truncate py-4">
                            {rowData.type === 'opening' || rowData.type === 'closing' ? '' :
                            <span className={`px-2.5 py-1 rounded-full font-medium inline-block
                              ${rowData.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-right text-xs text-amber-900 truncate py-4 px-4">
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
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-right text-xs text-amber-900 truncate py-4 px-4">
                            {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
                             rowData.credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      />
                      <Column
                        label="Running Balance"
                        dataKey="runningBalance"
                        width={120}
                        headerRenderer={({ label }) => (
                          <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
                            {label}
                          </div>
                        )}
                        cellRenderer={({ rowData }) => (
                          <div className="text-right text-xs text-amber-900 truncate py-4 px-4 font-medium">
                            {rowData.type === 'opening' ? cashInfo.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                             rowData.type === 'closing' ? (cashInfo.openingBalance + cashInfo.netFlow).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                             rowData.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      />
                    </Table>
                  )}
                </AutoSizer>
                </div>
              </div>
            </div>

            {/* Quick Info Section */}
            <div className="w-72">
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="p-4 border-b bg-amber-50/50">
                  <h3 className="font-medium text-amber-800 flex items-center gap-2">
                    <span className="text-amber-500">☀</span> 
                    Quick Summary
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cash Inflow</span>
                    <span className="text-sm font-medium text-green-600">₹ {cashInfo.inflow.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cash Outflow</span>
                    <span className="text-sm font-medium text-red-600">₹ {cashInfo.outflow.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Net Flow</span>
                    <span className="text-sm font-medium text-amber-600">₹ {cashInfo.netFlow.toFixed(2)}</span>
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