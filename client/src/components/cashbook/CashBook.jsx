import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, ArrowUpDown, FileSpreadsheet, Printer, Mail, X } from 'lucide-react';
import CashAdjustment from './CashAdjustment';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CashBook({ isOpen, onClose }) {
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return {
      from: weekAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [cashInfo, setCashInfo] = useState({
    inflow: 0,
    outflow: 0,
    netFlow: 0
  });
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);

  const fetchTransactions = async () => {
    if (!dateRange.from || !dateRange.to) return;
    setLoading(true);
    setError('');
    try {
      // Fetch both tokens and expenses
      const [tokensResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/tokens`, {
          params: {
            from_date: dateRange.from,
            to_date: dateRange.to
          }
        }),
        axios.get(`${API_BASE_URL}/api/expenses`, {
          params: {
            from_date: dateRange.from,
            to_date: dateRange.to
          }
        })
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

      // Combine and sort transactions by date
      const allTransactions = [...tokenTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(allTransactions);
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
    const pollInterval = setInterval(fetchTransactions, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    setFilteredTransactions(transactions);

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      return transactionDate >= fromDate && transactionDate <= toDate;
    });

    const info = filtered.reduce((acc, curr) => ({
      inflow: acc.inflow + curr.credit,
      outflow: acc.outflow + curr.debit,
      netFlow: (acc.inflow + curr.credit) - (acc.outflow + curr.debit)
    }), { inflow: 0, outflow: 0, netFlow: 0 });
    setCashInfo(info);
  }, [transactions, dateRange]);

  const handleSearch = () => {
    if (!transactions.length) return;

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      return transactionDate >= fromDate && transactionDate <= toDate;
    });
    setFilteredTransactions(filtered);

    // Calculate cash info
    const info = filtered.reduce((acc, curr) => ({
      inflow: acc.inflow + curr.credit,
      outflow: acc.outflow + curr.debit,
      netFlow: (acc.inflow + curr.credit) - (acc.outflow + curr.debit)
    }), { inflow: 0, outflow: 0, netFlow: 0 });
    setCashInfo(info);
  };

  const handleReset = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    setDateRange({
      from: weekAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
    handleSearch();
  };

  const handleQuickFilter = (days) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    setDateRange({
      from: startDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
    handleSearch();
  };

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
      className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-800">Cash Book</h1>
            <span className="text-sm px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">Report</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="text-2xl font-semibold text-amber-600">₹ {cashInfo.netFlow.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Net Balance</div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
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
          {/* Date Range and Actions */}
          <div className="p-4 flex flex-col gap-4 border-b bg-white sticky top-0 z-10">
            {/* Date Range Row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">From</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSearch}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Search size={16} />
                  Search
                </button>
                
                <button 
                  onClick={handleReset}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>

              <div className="ml-auto">
                <button 
                  onClick={() => setShowAdjustment(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowUpDown size={16} />
                  Cash Adjustments
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <button onClick={() => handleQuickFilter(0)} 
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 transition-colors">Today</button>
                <button onClick={() => handleQuickFilter(1)} 
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 transition-colors">Yesterday</button>
                <button onClick={() => handleQuickFilter(7)} 
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 transition-colors">7 days</button>
                <button onClick={() => handleQuickFilter(30)} 
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 transition-colors">30 days</button>
              </div>
              <button 
                onClick={() => console.log('Cash to Bank clicked')} 
                className="ml-auto text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
              >
                Cash 2 Bank
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 flex gap-4">
            {/* Table Section */}
            <div className="flex-1">
              <div className="border rounded-xl">
                <div className="overflow-auto max-h-[calc(90vh-280px)]">
                <table className="w-full">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="py-2.5 px-4 text-left text-sm font-medium text-amber-800">Date</th>
                      <th className="py-2.5 px-4 text-left text-sm font-medium text-amber-800">Particulars</th>
                      <th className="py-2.5 px-4 text-left text-sm font-medium text-amber-800">Type</th>
                      <th className="py-2.5 px-4 text-right text-sm font-medium text-amber-800">Debit</th>
                      <th className="py-2.5 px-4 text-right text-sm font-medium text-amber-800">Credit</th>
                      <th className="py-2.5 px-4 text-right text-sm font-medium text-amber-800">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="bg-amber-50/50">
                      <td colSpan={4} className="py-2 px-4 text-sm font-medium text-gray-700">Opening Balance</td>
                      <td className="py-2 px-4 text-right text-sm font-medium text-gray-700">0.00</td>
                    </tr>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-4 text-sm text-gray-600">{transaction.date}</td>
                        <td className="py-2.5 px-4 text-sm text-gray-600">{transaction.particulars}</td>
                        <td className="py-2.5 px-4">
                          <span className={`text-sm px-2.5 py-1 rounded-full font-medium inline-block
                            ${transaction.type === 'Income' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                            }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-sm text-gray-600">{transaction.debit.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-sm text-gray-600">{transaction.credit.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-sm text-gray-600">{(transaction.debit || transaction.credit).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50/50">
                      <td colSpan={4} className="py-2 px-4 text-sm font-medium text-gray-700">Closing Balance</td>
                      <td className="py-2 px-4 text-right text-sm font-medium text-gray-700">{cashInfo.netFlow.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
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