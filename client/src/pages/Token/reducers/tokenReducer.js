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

export const tokenReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value
      };
    case 'RESET_FORM':
      return {
        ...state,
        code: "",
        name: "",
        test: "Skin Testing",
        weight: "",
        sample: "",
        amount: "50",
        searchQuery: "", // Add searchQuery reset
        editMode: false,
        editId: null,
        error: ""
      };
    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: true,
        editId: action.token.id,
        code: action.token.code,
        tokenNo: action.token.tokenNo,
        name: action.token.name,
        test: action.token.test,
        weight: action.token.weight,
        sample: action.token.sample,
        amount: action.token.amount
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
    case 'RESET_AFTER_EDIT':
      return {
        ...initialState,
        tokenNo: action.tokenNo,
        date: state.date,
        time: state.time,
        filteredTokens: state.filteredTokens
      };
    default:
      return state;
  }
};
