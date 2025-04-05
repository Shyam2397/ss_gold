import { useReducer, useCallback, useEffect } from 'react';
import { initialFormData } from '../constants/initialState';
import { validateForm, processFormData } from '../utils/validation';
import { calculateSum, calculateKarat } from '../utils/calculations';
import {
  fetchSkinTests,
  createSkinTest,
  updateSkinTest,
  deleteSkinTest,
  fetchTokenData,
  fetchPhoneNumbers,
} from '../api/skinTestApi';

// Action types
const ACTIONS = {
  SET_FORM_DATA: 'set_form_data',
  UPDATE_FORM_FIELD: 'update_form_field',
  SET_SKIN_TESTS: 'set_skin_tests',
  SET_IS_EDITING: 'set_is_editing',
  SET_ERROR: 'set_error',
  SET_SUCCESS: 'set_success',
  SET_LOADING: 'set_loading',
  SET_SUM: 'set_sum',
  SET_SEARCH_QUERY: 'set_search_query',
  RESET_FORM: 'reset_form',
  CLEAR_FORM_FIELDS: 'clear_form_fields'
};

// Initial state
const initialState = {
  formData: initialFormData,
  skinTests: [],
  isEditing: false,
  error: '',
  success: '',
  loading: false,
  sum: 0,
  searchQuery: ''
};

// Reducer function
const skinTestReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_FORM_DATA:
      return {
        ...state,
        formData: action.payload
      };
    case ACTIONS.UPDATE_FORM_FIELD:
      const { name, value } = action.payload;
      let newFormData = { ...state.formData, [name]: value };
      
      // Auto-calculate karat if gold_fineness is updated
      if (name === 'gold_fineness') {
        newFormData.karat = calculateKarat(value);
      }
      
      // Calculate sum whenever form data changes
      const newSum = calculateSum(newFormData);
      
      return {
        ...state,
        formData: newFormData,
        sum: newSum
      };
    case ACTIONS.SET_SKIN_TESTS:
      return {
        ...state,
        skinTests: action.payload
      };
    case ACTIONS.SET_IS_EDITING:
      return {
        ...state,
        isEditing: action.payload
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    case ACTIONS.SET_SUCCESS:
      return {
        ...state,
        success: action.payload
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case ACTIONS.SET_SUM:
      return {
        ...state,
        sum: action.payload
      };
    case ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload
      };
    case ACTIONS.RESET_FORM:
      return {
        ...state,
        formData: initialFormData,
        isEditing: false,
        error: '',
        success: '',
        sum: 0,
        searchQuery: ''
      };
    case ACTIONS.CLEAR_FORM_FIELDS:
      return {
        ...state,
        formData: {
          ...state.formData,
          date: '',
          time: '',
          name: '',
          weight: '',
          sample: '',
          code: '',
          phoneNumber: ''
        }
      };
    default:
      return state;
  }
};

export const useSkinTest = () => {
  const [state, dispatch] = useReducer(skinTestReducer, initialState);
  
  // Clear error messages after a timeout
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
      }, 5000); // 5 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [state.error]);
  
  // Clear success messages after a timeout
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: '' });
      }, 5000); // 5 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  const loadSkinTests = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      // fetchSkinTests now handles caching internally
      const sortedData = await fetchSkinTests();
      
      // Collect all codes that need phone numbers
      const testsWithCodes = sortedData.filter(test => test.code);
      const codes = testsWithCodes.map(test => test.code);
      
      // Batch fetch all phone numbers at once
      let phoneNumbers = {};
      if (codes.length > 0) {
        try {
          // Use the new batch function to fetch all phone numbers in one request
          phoneNumbers = await fetchPhoneNumbers(codes);
        } catch (err) {
          // Silent fail for phone numbers - we'll still show the tests
          console.error('Error fetching phone numbers in batch:', err);
        }
      }
      
      // Merge phone numbers with test data
      const testsWithPhoneNumbers = sortedData.map(test => {
        if (test.code && phoneNumbers[test.code]) {
          return { ...test, phoneNumber: phoneNumbers[test.code] || '' };
        }
        return test;
      });
      
      dispatch({ type: ACTIONS.SET_SKIN_TESTS, payload: testsWithPhoneNumbers });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to fetch skin tests' });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const updateFormData = useCallback((name, value) => {
    dispatch({ 
      type: ACTIONS.UPDATE_FORM_FIELD, 
      payload: { name, value }
    });
  }, []);

  const handleTokenChange = async (e) => {
    const { name, value } = e.target;
    if (state.error) dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
    updateFormData(name, value);

    if (name === 'tokenNo' && value) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const response = await fetchTokenData(value);
        
        if (response.data.success && response.data.data) {
          const { date, time, name, weight, sample, code } = response.data.data;
          
          const updatedFormData = {
            ...state.formData,
            date: date || '',  // Use the date directly from the server without any conversion
            time: time || '',
            name: name || '',
            weight: weight ? parseFloat(weight).toFixed(3) : '',
            sample: sample || '',
            code: code || '',
            tokenNo: value,
          };
          
          dispatch({ type: ACTIONS.SET_FORM_DATA, payload: updatedFormData });

          if (code) {
            try {
              // Use the batch function for better performance
              const phoneNumbers = await fetchPhoneNumbers([code]);
              if (phoneNumbers[code]) {
                dispatch({ 
                  type: ACTIONS.SET_FORM_DATA, 
                  payload: { ...updatedFormData, phoneNumber: phoneNumbers[code] }
                });
              }
            } catch (phoneErr) {
              // Handle phone number error silently
            }
          }
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: response.data.message || 'No token data found.' });
          dispatch({ type: ACTIONS.CLEAR_FORM_FIELDS });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Token number not found.' });
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to fetch token data. Please try again.' });
        }
        dispatch({ type: ACTIONS.CLEAR_FORM_FIELDS });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }
  };

  const clearFormFields = () => {
    dispatch({ type: ACTIONS.CLEAR_FORM_FIELDS });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent token number changes during editing
    if (state.isEditing && name === 'tokenNo') {
      return;
    }
    
    if (state.error) dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
    updateFormData(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a custom setError function that uses dispatch
    const setErrorWithDispatch = (errorMsg) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMsg });
    };
    
    if (!validateForm(state.formData, setErrorWithDispatch, state.isEditing)) return;

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      if (state.isEditing) {
        if (!state.formData.tokenNo) {
          throw new Error('Token number is required for updating');
        }

        const processedData = processFormData({
          ...state.formData,
          tokenNo: state.formData.tokenNo
        });

        await updateSkinTest(processedData.tokenNo, processedData);
        dispatch({ type: ACTIONS.SET_IS_EDITING, payload: false });
        await loadSkinTests();
        dispatch({ type: ACTIONS.SET_FORM_DATA, payload: initialFormData });
        dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${processedData.tokenNo} updated successfully!` });
        dispatch({ type: ACTIONS.SET_SUM, payload: 0 });
      } else {
        const processedData = processFormData(state.formData);
        const exists = state.skinTests.some(test => test.tokenNo === processedData.tokenNo);
        if (exists) {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Token number already exists' });
          return;
        }
        await createSkinTest(processedData);
        await loadSkinTests();
        dispatch({ type: ACTIONS.SET_FORM_DATA, payload: initialFormData });
        dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${processedData.tokenNo} saved successfully!` });
        dispatch({ type: ACTIONS.SET_SUM, payload: 0 });
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to submit form';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleEdit = async (test) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
      
      const tokenNo = test.tokenNo || test.token_no;
      
      if (!tokenNo) {
        throw new Error('Token number is required for editing');
      }
      
      // Preserve the original date format from the server
      // The server returns dates in YYYY-MM-DD format
      let formattedDate = test.date;
      // Only reformat if it's in DD-MM-YYYY format
      if (formattedDate && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(formattedDate)) {
        const dateParts = formattedDate.split(/[-/]/);
        formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      }

      const editData = {
        ...test,
        tokenNo: tokenNo,
        date: formattedDate || '',
        weight: test.weight ? parseFloat(test.weight).toFixed(3) : '',
      };

      if (editData.code) {
        try {
          // Use the batch function for better performance
          const phoneNumbers = await fetchPhoneNumbers([editData.code]);
          if (phoneNumbers[editData.code]) {
            editData.phoneNumber = phoneNumbers[editData.code];
          }
        } catch (phoneErr) {
          // Remove console.error for phone number fetch
        }
      }

      dispatch({ type: ACTIONS.SET_FORM_DATA, payload: editData });
      dispatch({ type: ACTIONS.SET_IS_EDITING, payload: true });
      const newSum = calculateSum(editData);
      dispatch({ type: ACTIONS.SET_SUM, payload: newSum });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to prepare data for editing. Please try again.' });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleDelete = async (tokenNo) => {
    const normalizedTokenNo = tokenNo?.toString().trim();
    
    if (!normalizedTokenNo) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Invalid token number for deletion' });
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

      const response = await deleteSkinTest(normalizedTokenNo);
      
      if (response.data?.success) {
        if (state.isEditing && state.formData.tokenNo === normalizedTokenNo) {
          handleReset();
        }
        await loadSkinTests();
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${normalizedTokenNo} deleted successfully!` });
      } else {
        throw new Error(response.data?.message || 'Failed to delete skin test');
      }
    } catch (err) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: err.response?.data?.message || 'Failed to delete skin test. Please try again.' 
      });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleReset = () => {
    dispatch({ type: ACTIONS.RESET_FORM });
  };

  return {
    formData: state.formData,
    skinTests: state.skinTests,
    isEditing: state.isEditing,
    error: state.error,
    success: state.success,
    loading: state.loading,
    sum: state.sum,
    searchQuery: state.searchQuery,
    setSearchQuery: (query) => dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query }),
    handleTokenChange,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleReset,
    loadSkinTests,
  };
};

export default useSkinTest;
