import { getApi } from './api';

// Create a promise that resolves to the API client
const getExpenseApi = async () => {
  const api = await getApi();
  return api;
};

export const getExpenseTypes = async () => {
  try {
    const api = await getExpenseApi();
    const response = await api.get('/api/expense-master');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch expense types');
  }
};

export const createExpenseType = async (expenseData) => {
  try {
    const api = await getExpenseApi();
    const response = await api.post('/api/expense-master', {
      expense_name: expenseData.expense_name
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create expense type');
  }
};

export const updateExpenseType = async (id, expenseData) => {
  try {
    const api = await getExpenseApi();
    const response = await api.put(`/api/expense-master/${id}`, {
      expense_name: expenseData.expense_name
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update expense type');
  }
};

export const deleteExpenseType = async (id) => {
  try {
    const api = await getExpenseApi();
    await api.delete(`/api/expense-master/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete expense type');
  }
};

export const getExpenses = async () => {
  try {
    const api = await getExpenseApi();
    const response = await api.get('/api/expenses');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch expenses');
  }
};

export const createExpense = async (expenseData) => {
  try {
    const api = await getExpenseApi();
    const response = await api.post('/api/expenses', {
      date: expenseData.date,
      expense_type: expenseData.expenseType,
      amount: parseFloat(expenseData.amount),
      paid_to: expenseData.paidTo,
      pay_mode: expenseData.payMode,
      remarks: expenseData.remarks
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create expense');
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    const api = await getExpenseApi();
    
    // Ensure required fields are present and properly formatted
    const requestData = {
      date: expenseData.date,  // Required
      expense_type: expenseData.expenseType,  // Required - note the underscore
      amount: parseFloat(expenseData.amount),  // Required
      paid_to: expenseData.paidTo || '',
      pay_mode: expenseData.payMode || '',
      remarks: expenseData.remarks || ''
    };
    
    // Verify required fields
    if (!requestData.date) {
      throw new Error('Date is required');
    }
    if (!requestData.expense_type) {
      throw new Error('Expense type is required');
    }
    if (isNaN(requestData.amount)) {
      throw new Error('Valid amount is required');
    }
    
    const response = await api.put(`/api/expenses/${id}`, requestData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update expense');
  }
};

export const deleteExpense = async (id) => {
  try {
    if (!id) {
      throw new Error('Expense ID is required');
    }
    const api = await getExpenseApi();
    const response = await api.delete(`/api/expenses/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete expense');
  }
};
