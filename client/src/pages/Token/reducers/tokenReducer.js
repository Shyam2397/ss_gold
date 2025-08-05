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

import { parseDate, formatDate } from '../../../utils/dateUtils';

export const tokenReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
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
      
      return {
        ...state,
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
    }
    case 'SET_EDIT_MODE':
      // Parse and format the date consistently
      const parsedDate = parseDate(action.token.date);
      const formattedDate = parsedDate ? formatDate(parsedDate, 'dd-MM-yyyy') : '';
      
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
      return {
        ...state,
        deleteConfirmation: action.value
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error
      };
    case 'SET_SUCCESS':
      return {
        ...state,
        success: action.message
      };
    case 'SET_FILTERED_TOKENS':
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
      
      return {
        ...initialState,
        tokenNo: action.tokenNo,
        date: `${day}-${month}-${year}`,
        time: `${hours}:${minutes}`,
        filteredTokens: state.filteredTokens
      };
    }
    default:
      return state;
  }
};
