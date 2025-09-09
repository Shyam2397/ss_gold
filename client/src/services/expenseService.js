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
    console.error('Error fetching expense types:', error);
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
    console.error('Error creating expense type:', error);
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
    console.error('Error updating expense type:', error);
    throw new Error(error.response?.data?.error || 'Failed to update expense type');
  }
};

export const deleteExpenseType = async (id) => {
  try {
    const api = await getExpenseApi();
    await api.delete(`/api/expense-master/${id}`);
  } catch (error) {
    console.error('Error deleting expense type:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete expense type');
  }
};

export const getExpenses = async () => {
  try {
    const api = await getExpenseApi();
    const response = await api.get('/api/expenses');
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
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
    console.error('Error creating expense:', error);
    throw new Error(error.response?.data?.error || 'Failed to create expense');
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    const api = await getExpenseApi();
    const response = await api.put(`/api/expenses/${id}`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
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
    console.error('Error deleting expense:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete expense');
  }
};
