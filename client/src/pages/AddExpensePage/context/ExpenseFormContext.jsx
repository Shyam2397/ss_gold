import React, { createContext, useContext, useReducer } from 'react';
import { format } from 'date-fns';

export const ExpenseFormContext = createContext();

export const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value
        }
      };
    case 'RESET_FORM':
      return {
        ...state,
        formData: {
          date: format(new Date(), 'yyyy-MM-dd'),
          expenseType: '',
          amount: '',
          paidTo: '',
          payMode: '',
          remarks: ''
        },
        error: null,
        success: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_SUCCESS':
      return { ...state, success: action.success };
    case 'SET_EXPENSE_TYPES':
      return { ...state, expenseTypes: action.expenseTypes };
    default:
      return state;
  }
};

export const initialState = {
  formData: {
    date: format(new Date(), 'yyyy-MM-dd'),
    expenseType: '',
    amount: '',
    paidTo: '',
    payMode: '',
    remarks: ''
  },
  expenseTypes: [],
  loading: false,
  error: null,
  success: false
};

export const ExpenseFormProvider = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  return (
    <ExpenseFormContext.Provider value={{ state, dispatch }}>
      {children}
    </ExpenseFormContext.Provider>
  );
};

export const useExpenseForm = () => {
  const context = useContext(ExpenseFormContext);
  if (!context) {
    throw new Error('useExpenseForm must be used within an ExpenseFormProvider');
  }
  return context;
};
