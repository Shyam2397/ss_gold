export const initialState = {
  code: "",
  name: "",
  phoneNumber: "",
  place: "",
  error: "",
  success: "",
  loading: false,
  customers: [],
  editMode: false,
  editId: null,
  searchQuery: "",
  deleteConfirmation: {
    isOpen: false,
    customerId: null
  }
};

export const ActionTypes = {
  SET_FIELD: 'SET_FIELD',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  SET_LOADING: 'SET_LOADING',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  SET_EDIT_MODE: 'SET_EDIT_MODE',
  RESET_FORM: 'RESET_FORM',
  SET_DELETE_CONFIRMATION: 'SET_DELETE_CONFIRMATION',
};

export const customerReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_FIELD:
      return {
        ...state,
        [action.field]: action.value,
        error: ''
      };
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        success: ''
      };
    case ActionTypes.SET_SUCCESS:
      return {
        ...state,
        success: action.payload,
        error: ''
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case ActionTypes.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload
      };
    case ActionTypes.SET_EDIT_MODE:
      const { customer } = action.payload;
      return {
        ...state,
        code: customer.code,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        place: customer.place,
        editMode: true,
        editId: customer.id,
        error: '',
        success: ''
      };
    case ActionTypes.RESET_FORM:
      return {
        ...state,
        code: '',
        name: '',
        phoneNumber: '',
        place: '',
        editMode: false,
        editId: null,
        error: '',
        success: '',
        searchQuery: '' // Added searchQuery reset
      };
    case ActionTypes.SET_DELETE_CONFIRMATION:
      return {
        ...state,
        deleteConfirmation: action.payload
      };
    default:
      return state;
  }
};
