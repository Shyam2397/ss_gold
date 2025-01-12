import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const AddExpense = ({ isOpen, onClose }) => {
  const initialFormData = {
    date: format(new Date(), 'yyyy-MM-dd'),
    expenseType: '',
    amount: '',
    paidTo: '',
    payMode: '',
    remarks: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch expense types
  const fetchExpenseTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/expense-master`);
      setExpenseTypes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expense types:', err);
      setError('Failed to fetch expense types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        expenseType: '',
        amount: '',
        paidTo: '',
        payMode: '',
        remarks: ''
      });
      fetchExpenseTypes();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const expenseData = {
        date: formData.date,
        expense_type: formData.expenseType,
        amount: parseFloat(formData.amount),
        paid_to: formData.paidTo,
        pay_mode: formData.payMode,
        remarks: formData.remarks
      };
      await axios.post(`${API_BASE_URL}/api/expenses`, expenseData);
      setFormData(initialFormData); // Reset form data after successful submission
      onClose();
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError('Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div>Loading...</div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div>Error: {error}</div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center bg-gradient-to-r from-yellow-400 to-yellow-500">
          <h2 className="text-xl font-semibold text-white">Add Expense</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-yellow-300 transition-colors"
          >
            <FiX className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-white"
                required
              />
            </div>

            {/* Expense Type Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Type <span className="text-red-500">*</span>
              </label>
              <select
                name="expenseType"
                value={formData.expenseType}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-white"
                required
              >
                <option value="" className="text-white">Select</option>
                {expenseTypes.map((type) => (
                  <option className="text-white" key={type.id} value={type.expense_name}>
                    {type.expense_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Paid To Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid To <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="paidTo"
                value={formData.paidTo}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-white"
                required
              />
            </div>

            {/* Pay Mode Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="payMode"
                value={formData.payMode}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-white"
                required
              >
                <option value="">Select</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Remarks Field - Full Width */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none text-white"
                placeholder="Add any additional notes here..."
              />
            </div>
          </div>

          {/* Footer with Save Button */}
          <div className="mt-8 flex justify-end border-t border-gray-200 pt-5">
            <button
              type="submit"
              className="px-6 py-2.5 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddExpense;
