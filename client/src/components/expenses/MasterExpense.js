import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';


const MasterExpense = ({ isOpen, onClose }) => {
  const [expenseName, setExpenseName] = useState('');
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Fetch expense types
  const fetchExpenseTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/expense-master`);
      setExpenseTypes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expense types:', err);
      setError('Failed to fetch expense types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenseTypes();
    } else {
      // Reset form when dialog closes
      setExpenseName('');
      setEditingId(null);
      setError(null);
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Show success message temporarily
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!expenseName.trim()) {
      setError('Expense name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/expense-master/${editingId}`, {
          expenseName: expenseName.trim()
        });
        showSuccessMessage('Expense type updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/expense-master`, {
          expenseName: expenseName.trim()
        });
        showSuccessMessage('Expense type added successfully');
      }

      setExpenseName('');
      setEditingId(null);
      await fetchExpenseTypes();
    } catch (err) {
      console.error('Error saving expense type:', err);
      if (err.response?.status === 409) {
        setError('This expense type already exists');
      } else {
        setError(err.response?.data?.error || 'Failed to save expense type. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setExpenseName(expense.expense_name);
    setEditingId(expense.id);
    setError(null);
    setSuccessMessage('');
  };

  const handleDelete = async (id) => {
    setDeleteConfirmation(id);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/expense-master/${deleteConfirmation}`);
      showSuccessMessage('Expense type deleted successfully');
      await fetchExpenseTypes();
    } catch (err) {
      console.error('Error deleting expense type:', err);
      setError('Failed to delete expense type. Please try again.');
    } finally {
      setLoading(false);
      setDeleteConfirmation(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setExpenseName('');
    setError(null);
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center bg-gradient-to-r from-amber-500 to-yellow-500">
          <h2 className="text-xl font-semibold text-white">Expense Master</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-amber-400 transition-colors"
            disabled={loading}
          >
            <FiX className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between">
            <h3 className="text-gray-700 font-medium mb-4">
              {editingId ? 'Edit' : 'Add'} Expense Name
            </h3>
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2"
                >
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-1 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2"
                >
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  placeholder="Enter expense name"
                  required
                  disabled={loading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 space-x-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingId ? 'Updating...' : 'Saving...'}
                    </span>
                  ) : (
                    editingId ? 'Update' : 'Save'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Data Section */}
          <div className="max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
            <table className="min-w-full divide-y divide-amber-200">
              <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Expense Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-200">
                {loading && !expenseTypes.length ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : expenseTypes.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                      No expense types found
                    </td>
                  </tr>
                ) : (
                  expenseTypes.map((expense) => (
                    <tr key={expense.id} className="hover:bg-amber-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.expense_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-amber-600 hover:text-amber-900 p-1 rounded-full hover:bg-amber-100 transition-colors"
                          disabled={loading}
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors ml-2"
                          disabled={loading}
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {deleteConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-gray-700 font-medium mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this expense type?</p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MasterExpense;
