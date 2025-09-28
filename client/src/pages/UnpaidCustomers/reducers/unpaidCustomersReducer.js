import React from 'react';

// Action Types
export const ACTIONS = {
  SET_EXPORTING: 'SET_EXPORTING',
  TOGGLE_CUSTOMER: 'TOGGLE_CUSTOMER',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  RESET_STATE: 'RESET_STATE'
};

// Initial State
export const initialState = {
  isExporting: false,
  expandedCustomers: [], // Changed from Set to array
  searchTerm: ''
};

// Reducer function
export function unpaidCustomersReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_EXPORTING:
      return { ...state, isExporting: action.payload };
      
    case ACTIONS.TOGGLE_CUSTOMER: {
      const customerId = action.payload;
      return {
        ...state,
        expandedCustomers: state.expandedCustomers.includes(customerId)
          ? state.expandedCustomers.filter(id => id !== customerId)
          : [...state.expandedCustomers, customerId]
      };
    }
      
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
      
    case ACTIONS.RESET_STATE:
      return { ...initialState };
      
    default:
      return state;
  }
}

// Action Creators
export const setExporting = (isExporting) => ({
  type: ACTIONS.SET_EXPORTING,
  payload: isExporting
});

export const toggleCustomer = (code) => ({
  type: ACTIONS.TOGGLE_CUSTOMER,
  payload: code
});

export const setSearchTerm = (term) => ({
  type: ACTIONS.SET_SEARCH_TERM,
  payload: term
});

export const resetState = () => ({
  type: ACTIONS.RESET_STATE
});

// Custom hook for using the reducer
export const useUnpaidCustomers = () => {
  const [state, dispatch] = React.useReducer(unpaidCustomersReducer, initialState);
  
  // Memoize the actions to prevent unnecessary re-renders
  const actions = React.useMemo(() => ({
    setExporting: (isExporting) => dispatch(setExporting(isExporting)),
    toggleCustomer: (code) => dispatch(toggleCustomer(code)),
    setSearchTerm: (term) => dispatch(setSearchTerm(term)),
    resetState: () => dispatch(resetState())
  }), []);
  
  return [state, actions];
};
