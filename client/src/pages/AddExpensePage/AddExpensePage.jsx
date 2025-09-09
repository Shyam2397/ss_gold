import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { getExpenseTypes, createExpense, getExpenses, deleteExpense } from '../../services/expenseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ExpenseFormProvider, useExpenseForm } from './context/ExpenseFormContext';
import ExpenseForm from './components/ExpenseForm';
import ExpensesTable from './components/ExpensesTable';

const AddExpenseContent = () => {
  const { state, dispatch } = useExpenseForm();
  const { loading, error, success } = state;
  const [expenses, setExpenses] = useState([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

  // Fetch expense types
  const fetchExpenseTypes = async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      const data = await getExpenseTypes();
      dispatch({ type: 'SET_EXPENSE_TYPES', expenseTypes: data });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (err) {
      console.error('Error fetching expense types:', err);
      dispatch({ type: 'SET_ERROR', error: err.message || 'Failed to fetch expense types' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  useEffect(() => {
    fetchExpenseTypes();
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoadingExpenses(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      dispatch({ type: 'SET_ERROR', error: 'Failed to load expenses' });
    } finally {
      setIsLoadingExpenses(false);
    }
  };

const handleEditExpense = (expense) => {
    // Set form values for editing
    dispatch({ 
      type: 'SET_FIELD', 
      field: 'date', 
      value: expense.date.split('T')[0] // Format date for input
    });
    // Set other fields...
    
    // Scroll to form
    document.getElementById('expense-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId);
        await fetchExpenses(); // Refresh the list
        dispatch({ 
          type: 'SET_SUCCESS', 
          success: 'Expense deleted successfully' 
        });
        setTimeout(() => dispatch({ type: 'SET_SUCCESS', success: false }), 3000);
      } catch (err) {
        console.error('Error deleting expense:', err);
        dispatch({ 
          type: 'SET_ERROR', 
          error: 'Failed to delete expense' 
        });
      }
    }
  };

  const handleExpenseSubmit = async (formData) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      await createExpense(formData);
      
      // Reset form and show success message
      dispatch({ type: 'RESET_FORM' });
      dispatch({ 
        type: 'SET_SUCCESS', 
        success: 'Expense added successfully!' 
      });
      
      // Refresh expenses list
      await fetchExpenses();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        dispatch({ type: 'SET_SUCCESS', success: false });
      }, 3000);
    } catch (err) {
      console.error('Error submitting expense:', err);
      dispatch({ 
        type: 'SET_ERROR', 
        error: err.message || 'Failed to submit expense' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };


  if (loading && !state.expenseTypes.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-amber-50/30 py-4 px-3 sm:px-4 lg:px-6"
    >
      <div className="max-w-8xl mx-auto space-y-4">
        {/* Add Expense Form */}
        <div className="bg-white rounded-xl py-4 px-4 border border-amber-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div className="flex items-center">
              <FiPlus className="w-5 h-5 text-amber-600 mr-2" />
              <h2 className="text-lg font-semibold text-amber-900">Add New Expense</h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 sm:text-right">
              {error && (
                <div className="inline-flex items-center text-red-600 text-sm bg-red-50 px-3 py-1 rounded-lg">
                  <FiAlertCircle className="mr-1.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="inline-flex items-center text-green-600 text-sm bg-green-50 px-3 py-1 rounded-lg">
                  <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}
            </div>
          </div>

          <div id="expense-form">
            <ExpenseForm onSubmit={handleExpenseSubmit} />
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl py-2 px-4 border border-amber-100 shadow-sm">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-amber-900 flex items-center">
              <FiDollarSign className="w-5 h-5 text-amber-600 mr-2" />
              Recent Expenses
            </h2>
          </div>
          
          <div className="overflow-hidden">
            {isLoadingExpenses ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <ExpensesTable 
                expenses={expenses} 
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
              />
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
};

const AddExpensePage = () => (
  <ExpenseFormProvider>
    <AddExpenseContent />
  </ExpenseFormProvider>
);

export default AddExpensePage;
