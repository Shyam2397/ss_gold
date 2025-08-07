import { useReducer, useCallback, useEffect } from 'react';
import { initialFormData } from '../constants/initialState';
import { validateForm, processFormData } from '../utils/validation';
import { calculateSum, calculateKarat } from '../utils/calculations';
import skinTestService from '../../../services/skinTestService';

// Clean up old cache-related code if it exists
const skinTestCache = {
  get: () => null,
  set: () => {},
  clearResource: () => {}
};

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
      const skinTests = await skinTestService.getSkinTests();
      
      // Only fetch phone numbers if we have tests with codes
      if (skinTests.some(test => test.code)) {
        // Use Promise.all for parallel fetching
        const updatedTests = await Promise.all(
          skinTests.map(async (test) => {
            if (!test.code) return test;
            
            try {
              const phoneNumber = await skinTestService.getPhoneNumber(test.code);
              // Only return a new object if phoneNumber exists
              return phoneNumber ? { ...test, phoneNumber } : test;
            } catch (err) {
              console.error('Error fetching phone number:', err);
              return test; // Return original test if there's an error
            }
          })
        );
        
        // Only update if tests have actually changed
        dispatch({ type: ACTIONS.SET_SKIN_TESTS, payload: updatedTests });
      } else {
        dispatch({ type: ACTIONS.SET_SKIN_TESTS, payload: skinTests });
      }
    } catch (err) {
      console.error('Error loading skin tests:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to fetch skin tests: ' + (err.message || 'Unknown error') });
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

  const handleEdit = async (test) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
      
      const tokenNo = test.tokenNo || test.tokenno || test.token_no;
      
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
          const phoneNumber = await skinTestService.getPhoneNumber(editData.code);
          if (phoneNumber) {
            editData.phoneNumber = phoneNumber;
          }
        } catch (phoneErr) {
          console.error('Error fetching phone number:', phoneErr);
          // Continue without phone number if there's an error
        }
      }

      dispatch({ type: ACTIONS.SET_FORM_DATA, payload: editData });
      dispatch({ type: ACTIONS.SET_IS_EDITING, payload: true });
      const newSum = calculateSum(editData);
      dispatch({ type: ACTIONS.SET_SUM, payload: newSum });
    } catch (err) {
      console.error('Error preparing data for editing:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Failed to prepare data for editing: ' + (err.message || 'Unknown error') 
      });
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

    if (!window.confirm(`Are you sure you want to delete skin test #${normalizedTokenNo}?`)) {
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

      await skinTestService.deleteSkinTest(normalizedTokenNo);
      
      // Reset form if the deleted test is the one being edited
      if (state.isEditing && state.formData.tokenNo === normalizedTokenNo) {
        handleReset();
      }
      
      // Refresh the skin tests list
      await loadSkinTests();
      
      // Show success message
      dispatch({ 
        type: ACTIONS.SET_SUCCESS, 
        payload: `Skin test #${normalizedTokenNo} deleted successfully!` 
      });
    } catch (err) {
      console.error('Error deleting skin test:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: err.message || 'Failed to delete skin test. Please try again.' 
      });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleReset = () => {
    dispatch({ type: ACTIONS.RESET_FORM });
  };

  // Memoize handlers to prevent recreation on each render
  const memoizedHandleChange = useCallback((e) => {
    e.preventDefault();
    const { name, value } = e.target;
    
    // Prevent token number changes during editing
    if (state.isEditing && name === 'tokenNo') {
      return;
    }
    
    if (state.error) dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
    updateFormData(name, value);
  }, [state.isEditing, state.error, updateFormData]);

  const memoizedHandleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Create a custom setError function that uses dispatch
    const setErrorWithDispatch = (errorMsg) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMsg });
    };
    
    if (!validateForm(state.formData, setErrorWithDispatch, state.isEditing)) return;

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const processedData = processFormData({
        ...state.formData,
        tokenNo: state.formData.tokenNo || ''
      });

      if (state.isEditing) {
        if (!processedData.tokenNo) {
          throw new Error('Token number is required for updating');
        }

        // Update existing skin test
        await skinTestService.updateSkinTest(processedData.tokenNo, processedData);
        dispatch({ type: ACTIONS.SET_IS_EDITING, payload: false });
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${processedData.tokenNo} updated successfully!` });
      } else {
        // Check for duplicate token number
        const exists = state.skinTests.some(test => test.tokenNo === processedData.tokenNo);
        if (exists) {
          throw new Error('Token number already exists');
        }

        // Create new skin test
        await skinTestService.createSkinTest(processedData);
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${processedData.tokenNo} saved successfully!` });
      }

      // Common success actions
      await loadSkinTests();
      dispatch({ type: ACTIONS.SET_FORM_DATA, payload: initialFormData });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
      dispatch({ type: ACTIONS.SET_SUM, payload: 0 });
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err.message || 'Failed to submit form';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.formData, state.isEditing, state.skinTests, loadSkinTests]);

  const handleTokenChange = async (e) => {
    e.preventDefault(); // Prevent form submission
    const { name, value } = e.target;
    if (state.error) dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
    
    // Update the token number in the form data
    updateFormData(name, value);

    if (name === 'tokenNo' && value) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const tokenData = await skinTestService.getTokenData(value);
        
        if (tokenData) {
          const { date, time, name, weight, sample, code } = tokenData;
          
          const updatedFormData = {
            ...state.formData,
            date: date || '',
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
              const phoneNumber = await skinTestService.getPhoneNumber(code);
              if (phoneNumber) {
                dispatch({ 
                  type: ACTIONS.SET_FORM_DATA, 
                  payload: { ...updatedFormData, phoneNumber }
                });
              }
            } catch (phoneErr) {
              console.error('Error fetching phone number:', phoneErr);
              // Continue without phone number if there's an error
            }
          }
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'No token data found.' });
          dispatch({ type: ACTIONS.CLEAR_FORM_FIELDS });
        }
      } catch (err) {
        console.error('Error fetching token data:', err);
        if (err.response?.status === 404) {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Token number not found.' });
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to fetch token data: ' + (err.message || 'Unknown error') });
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
    e.preventDefault(); // Prevent form submission
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
      const processedData = processFormData({
        ...state.formData,
        tokenNo: state.formData.tokenNo || ''
      });

      if (state.isEditing) {
        if (!processedData.tokenNo) {
          throw new Error('Token number is required for updating');
        }

        // Update existing skin test
        await skinTestService.updateSkinTest(processedData.tokenNo, processedData);
        dispatch({ type: ACTIONS.SET_IS_EDITING, payload: false });
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${processedData.tokenNo} updated successfully!` });
      } else {
        // Check for duplicate token number
        const exists = state.skinTests.some(test => test.tokenNo === processedData.tokenNo);
        if (exists) {
          throw new Error('Token number already exists');
        }

        // Create new skin test
        await skinTestService.createSkinTest(processedData);
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: `Skin test #${processedData.tokenNo} saved successfully!` });
      }

      // Common success actions
      await loadSkinTests();
      dispatch({ type: ACTIONS.SET_FORM_DATA, payload: initialFormData });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
      dispatch({ type: ACTIONS.SET_SUM, payload: 0 });
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err.message || 'Failed to submit form';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Memoize handlers to prevent recreation on each render
  const memoizedHandleEdit = useCallback(handleEdit, []);
  const memoizedHandleDelete = useCallback(handleDelete, [state.isEditing, state.formData.tokenNo, loadSkinTests]);
  const memoizedHandleReset = useCallback(handleReset, []);
  const memoizedHandleTokenChange = useCallback(handleTokenChange, [state.error, updateFormData]);

  return {
    formData: state.formData,
    skinTests: state.skinTests,
    isEditing: state.isEditing,
    error: state.error,
    success: state.success,
    loading: state.loading,
    sum: state.sum,
    searchQuery: state.searchQuery,
    setSearchQuery: useCallback((value) => {
      dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: value });
    }, []),
    handleTokenChange: memoizedHandleTokenChange,
    handleChange: memoizedHandleChange,
    handleSubmit: memoizedHandleSubmit,
    handleEdit: memoizedHandleEdit,
    handleDelete: memoizedHandleDelete,
    handleReset: memoizedHandleReset,
    loadSkinTests: useCallback(loadSkinTests, []),
  };
};

export default useSkinTest;
