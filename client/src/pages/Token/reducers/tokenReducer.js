export const initialState = {
  // Form state
  code: "",
  tokenNo: "",
  date: "",
  time: "",
  name: "",
  test: "Skin Testing",
  weight: "",
  sample: "",
  amount: "50",
  
  // UI state
  editMode: false,
  editId: null,
  filteredTokens: [],
  searchQuery: "",
  deleteConfirmation: {
    isOpen: false,
    tokenId: null
  },
  error: "",
  success: ""
};

import { formatDate } from '../../../utils/dateUtils';

// Helper function to check if two objects are deeply equal
const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!deepEqual(obj1[key], obj2[key])) return false;
    } else if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
};

export const tokenReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      // Only update if the value actually changed
      if (state[action.field] === action.value) {
        return state;
      }
      return {
        ...state,
        [action.field]: action.value
      };
    case 'RESET_FORM': {
      // Get current date and time
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      
      const newFormState = {
        // Reset all form fields to initial state
        code: "",
        name: "",
        test: "Skin Testing",
        weight: "",
        sample: "",
        amount: "50",
        // Set current date and time
        date: `${day}-${month}-${year}`,
        time: `${hours}:${minutes}`,
        // Reset token number will be handled by the component
        tokenNo: action.tokenNo || state.tokenNo,
        // Reset UI state
        searchQuery: "",
        editMode: false,
        editId: null,
        error: "",
        success: ""
      };
      
      // Check if state actually changed using deep equality
      if (deepEqual(state, { ...state, ...newFormState })) {
        return state;
      }
      
      return {
        ...state,
        ...newFormState
      };
    }
    case 'SET_EDIT_MODE':
      // Only update if we're not already in edit mode or editing a different token
      if (state.editMode && state.editId === action.token.id) {
        return state;
      }
      
      return {
        ...state,
        editMode: true,
        editId: action.token.id,
        code: action.token.code || "",
        tokenNo: action.token.tokenNo || "",
        // Format date to match display format (DD-MM-YYYY)
        date: formatDate(action.token.date) || "",
        // Ensure time is in HH:MM format
        time: (action.token.time || "").substring(0, 5),
        name: action.token.name || "",
        // Ensure test is always a string and has a default value
        test: String(action.token.test || "Skin Testing"),
        weight: action.token.weight ? String(action.token.weight) : "",
        sample: action.token.sample || "",
        amount: action.token.amount ? String(action.token.amount) : "50"
      };
    case 'SET_DELETE_CONFIRMATION':
      // Only update if values actually changed
      if (state.deleteConfirmation.isOpen === action.value.isOpen && 
          state.deleteConfirmation.tokenId === action.value.tokenId) {
        return state;
      }
      return {
        ...state,
        deleteConfirmation: action.value
      };
    case 'SET_ERROR':
      if (state.error === action.error) {
        return state;
      }
      return {
        ...state,
        error: action.error
      };
    case 'SET_SUCCESS':
      if (state.success === action.message) {
        return state;
      }
      return {
        ...state,
        success: action.message
      };
    case 'SET_FILTERED_TOKENS':
      // Only update if tokens actually changed
      if (state.filteredTokens === action.tokens) {
        return state;
      }
      return {
        ...state,
        filteredTokens: action.tokens
      };
    case 'RESET_AFTER_EDIT': {
      // Get current date and time
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      
      const resetState = {
        ...initialState,
        tokenNo: action.tokenNo,
        date: `${day}-${month}-${year}`,
        time: `${hours}:${minutes}`
      };
      
      // Preserve filteredTokens to avoid unnecessary re-renders
      if (state.filteredTokens) {
        resetState.filteredTokens = state.filteredTokens;
      }
      
      return resetState;
    }
    default:
      return state;
  }
};