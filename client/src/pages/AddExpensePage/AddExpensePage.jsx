import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { getExpenseTypes, createExpense, getExpenses, deleteExpense, updateExpense } from '../../services/expenseService';
import MasterExpense from './MasterExpense';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ExpenseFormProvider, useExpenseForm } from './context/ExpenseFormContext';
import ExpenseForm from './components/ExpenseForm';
import ExpensesTable from './components/ExpensesTable';
import FormActions from './components/FormActions';

const AddExpenseContent = () => {
  const { state, dispatch } = useExpenseForm();
  const { loading, error, success } = state;
  const [expenses, setExpenses] = useState([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isMasterExpenseOpen, setIsMasterExpenseOpen] = useState(false);

  // Fetch expense types
  const fetchExpenseTypes = useCallback(async () => {
    try {
      const types = await getExpenseTypes();
      setExpenseTypes(types);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to load expense types' });
    }
  }, []);

  // Fetch expense types when component mounts or when master expense dialog closes
  useEffect(() => {
    fetchExpenseTypes();
  }, [fetchExpenseTypes]);

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
      dispatch({ type: 'SET_ERROR', error: 'Failed to load expenses' });
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const handleEditExpense = (expense) => {
    // Handle date with timezone - create a date object and format it as YYYY-MM-DD
    let formattedDate = '';
    try {
      const dateObj = new Date(expense.date);
      if (!isNaN(dateObj.getTime())) {
        const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
        formattedDate = localDate.toISOString().split('T')[0];
      } else {
        formattedDate = new Date().toISOString().split('T')[0]; // Fallback to today's date
      }
    } catch (e) {
      formattedDate = new Date().toISOString().split('T')[0]; // Fallback to today's date
    }

    // Handle expense type - ensure we have the correct format
    let expenseTypeValue = '';
    if (expense.expense_type) {
      // If expense_type is an object with id, use that, otherwise use the value directly
      expenseTypeValue = (typeof expense.expense_type === 'object' && expense.expense_type.id) 
        ? expense.expense_type.id 
        : expense.expense_type;
    } else if (expense.expenseType) {
      // Handle camelCase version if it exists
      expenseTypeValue = (typeof expense.expenseType === 'object' && expense.expenseType.id)
        ? expense.expenseType.id
        : expense.expenseType;
    }

    // Set all form values for editing
    const fieldsToUpdate = {
      id: expense.id || expense._id, // Include the expense ID
      date: formattedDate,
      expenseType: expenseTypeValue,
      amount: expense.amount ? String(expense.amount) : '',
      paidTo: expense.paid_to || expense.paidTo || '',
      payMode: expense.pay_mode || expense.payMode || '',
      remarks: expense.remarks || ''
    };

    // Update each field in the form
    Object.entries(fieldsToUpdate).forEach(([field, value]) => {
      dispatch({
        type: 'SET_FIELD',
        field,
        value
      });
    });
    
    // Set the current expense being edited
    setEditingExpense(expense);
    
    // Scroll to form
    document.getElementById('expense-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteExpense = async (expenseId) => {
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
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_FORM' });
    setEditingExpense(null);
  };

  const handleOpenMasterExpense = () => {
    setIsMasterExpenseOpen(true);
  };

  const handleCloseMasterExpense = () => {
    setIsMasterExpenseOpen(false);
    // Refresh expense types when the dialog closes
    fetchExpenseTypes();
  };

  const handleExpenseSubmit = async (formData) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      // Format the data before sending to the server
      const formattedData = {
        date: formData.date,
        expenseType: formData.expenseType,
        amount: formData.amount,
        paidTo: formData.paidTo || '',
        payMode: formData.payMode || '',
        remarks: formData.remarks || ''
      };
      
      if (editingExpense) {
        // Update existing expense
        await updateExpense(editingExpense.id || editingExpense._id, formattedData);
        dispatch({ 
          type: 'SET_SUCCESS', 
          success: 'Expense updated successfully!' 
        });
      } else {
        // Create new expense
        await createExpense(formattedData);
        dispatch({ 
          type: 'SET_SUCCESS', 
          success: 'Expense added successfully!' 
        });
      }
      
      // Reset form and refresh expenses list
      handleReset();
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
            <ExpenseForm
              expenseTypes={expenseTypes}
              onExpenseSubmit={handleExpenseSubmit}
              loading={state.loading}
              isEditing={!!editingExpense}
            />
            <FormActions
              loading={state.loading}
              onReset={handleReset}
              onOpenMasterExpense={handleOpenMasterExpense}
              isEditing={!!editingExpense}
            />
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

      <AnimatePresence>
        {isMasterExpenseOpen && (
          <MasterExpense
            isOpen={isMasterExpenseOpen}
            onClose={handleCloseMasterExpense}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AddExpensePage = () => (
  <ExpenseFormProvider>
    <AddExpenseContent />
  </ExpenseFormProvider>
);

export default AddExpensePage;
