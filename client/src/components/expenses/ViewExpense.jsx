import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiEdit2, FiTrash2, FiInfo } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ViewExpense = ({ isOpen, onClose }) => {
  const [allExpenses, setAllExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [dateRange, setDateRange] = useState('Today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Calculate total amount with proper formatting
  const calculateTotal = (expenses) => {
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(total);
  };

  // Fetch all expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/expenses`);
      setAllExpenses(response.data);
      setFilteredExpenses(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen]);

  // Filter expenses whenever filter criteria changes
  useEffect(() => {
    let result = [...allExpenses];

    if (dateRange === 'Today') {
      const today = new Date();
      result = result.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === today.toDateString();
      });
    } else if (dateRange === 'Last 7 days') {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      result = result.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= last7Days;
      });
    } else if (dateRange === 'Last 30 days') {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      result = result.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= last30Days;
      });
    } else if (dateRange === 'Custom Range' && fromDate && toDate) {
      result = result.filter((expense) => {
        const expenseDate = new Date(expense.date);
        const fromDateValue = new Date(fromDate);
        const toDateValue = new Date(toDate);
        return expenseDate >= fromDateValue && expenseDate <= toDateValue;
      });
    }

    if (searchKeyword.trim()) {
      result = result.filter((expense) => {
        const searchTerm = searchKeyword.toLowerCase();
        return (
          expense.expense_type.toLowerCase().includes(searchTerm) ||
          expense.paid_to.toLowerCase().includes(searchTerm) ||
          expense.pay_mode.toLowerCase().includes(searchTerm) ||
          expense.remarks.toLowerCase().includes(searchTerm)
        );
      });
    }

    setFilteredExpenses(result);
  }, [dateRange, fromDate, toDate, searchKeyword, allExpenses]);

  // Handle delete confirmation
  const handleDeleteClick = (expense) => {
    setDeleteConfirmation(expense);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/expenses/${deleteConfirmation.id}`);
      setDeleteConfirmation(null);
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense({
      ...expense,
      date: expense.date.split('T')[0] // Format date for input field
    });
  };

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/expenses/${editingExpense.id}`, editingExpense);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden"
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center bg-gradient-to-r from-yellow-400 to-yellow-500">
          <h2 className="text-xl font-semibold text-white">View Expenses</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-yellow-300 transition-colors"
          >
            <FiX className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && <div className="text-center">Loading...</div>}
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}

          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-amber-900">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border rounded-lg border-amber-200 bg-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 px-2 py-1"
              >
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Custom Range</option>
              </select>
              <span >From</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border rounded-lg border-amber-200 bg-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 px-2 py-1"
                disabled={dateRange !== 'Custom Range'}
              />

              <span>To</span>
              <input 
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border rounded-lg border-amber-200 bg-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 px-2 py-1"
                disabled={dateRange !== 'Custom Range'}
              />
            </div>

            <div className="flex-1">
              <input
                type="text"
                placeholder="Search keyword..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full border rounded-lg border-amber-200 bg-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 px-2 py-1 text-amber-900"
              />
            </div>
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto" style={{ height: '300px', overflowY: 'auto' }}>
            <table className="min-w-full divide-y divide-amber-100">
              <thead className="bg-amber-500 sticky top-0 z-10 text-white">
                <tr className='text-center'>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Paid To</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Pay Mode</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-amber-900">
                      {new Date(expense.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-amber-900">{expense.expense_type}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-amber-900">₹{expense.amount}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-amber-900">{expense.paid_to}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-amber-900">{expense.pay_mode}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-amber-900 max-w-[150px]">
                      {expense.remarks && expense.remarks.length > 20 ? (
                        <div className="group relative">
                          <span className="block truncate" title={expense.remarks}>
                            {expense.remarks}
                          </span>
                          <div className="absolute z-10 p-2 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -bottom-10 left-1/2 transform -translate-x-1/2">
                            {expense.remarks}
                          </div>
                        </div>
                      ) : (
                        expense.remarks || '-'
                      )}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-amber-600 hover:text-amber-900 px-2 rounded-full hover:bg-amber-50"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense)}
                        className="text-red-600 hover:text-red-900 px-2 rounded-full hover:bg-red-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 text-left text-black">
            <strong>Total: </strong> {calculateTotal(filteredExpenses)}
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {editingExpense && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-5 py-2 border-b border-gray-300 flex justify-between items-center bg-gradient-to-r from-yellow-400 to-yellow-500"><h3 className="text-lg font-medium">Edit Expense</h3></div>
            <form onSubmit={handleUpdate}>
              <div className="px-4 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                    className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paid To</label>
                  <input
                    type="text"
                    value={editingExpense.paid_to}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paid_to: e.target.value })}
                    className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pay Mode</label>
                  <select
                    value={editingExpense.pay_mode}
                    onChange={(e) => setEditingExpense({ ...editingExpense, pay_mode: e.target.value })}
                    className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editingExpense.remarks}
                    onChange={(e) => setEditingExpense({ ...editingExpense, remarks: e.target.value })}
                    className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    rows="2"
                  />
                </div>
              </div>
              <div className="my-4 mx-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-medium mb-4">Delete Expense</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ViewExpense;
