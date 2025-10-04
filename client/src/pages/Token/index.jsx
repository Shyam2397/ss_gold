import React, { useReducer, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import debounce from 'lodash/debounce';
import {
  FiUser,
  FiHash,
  FiClock,
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiSearch,
  FiSave,
  FiRotateCcw,
  FiPrinter,
  FiList,
  FiClipboard
} from "react-icons/fi";
import { BsReceipt } from "react-icons/bs";
import logoPath from '../../assets/logo.png';

// Components - using dynamic imports for better code splitting
import {
  FormField,
  FormSelect,
  TokenTable,
  LoadingSpinner
} from './components/LazyComponents';

// Dynamically import DeleteConfirmationModal only when needed
const DeleteConfirmationModal = React.lazy(() => 
  import(/* webpackChunkName: "token-delete-modal" */ './components/DeleteConfirmationModal')
);

// Hooks
import useToken from './hooks/useTokenQuery';

// Utils
import { preloadImages, convertImageToBase64, generatePrintContent } from './utils/printUtils';

import { tokenReducer, initialState } from './reducers/tokenReducer';

// Remove the render counter to avoid unnecessary logging
const useRenderCounter = () => {
  return 0;
};

const TokenPage = () => {
  const [state, dispatch] = useReducer(tokenReducer, initialState);
  const searchCacheRef = useRef(new Map());
  const renderCount = useRenderCounter();
  const MESSAGE_TIMEOUT = 5000; // 5 seconds
  
  // Custom hook for token operations
  const {
    tokens,
    loading,
    error,
    success,
    fetchTokens,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
    updatePaymentStatus
  } = useToken();

  // Clear error message after timeout (for errors from useToken hook)
  useEffect(() => {
    let errorTimer;
    if (error) {
      errorTimer = setTimeout(() => {
        dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
      }, MESSAGE_TIMEOUT);
    }
    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [error]);

  // Clear local error messages after timeout
  useEffect(() => {
    let localErrorTimer;
    if (state.error && !error) { // Only for local errors, not from useToken hook
      localErrorTimer = setTimeout(() => {
        dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
      }, MESSAGE_TIMEOUT);
    }
    return () => {
      if (localErrorTimer) clearTimeout(localErrorTimer);
    };
  }, [state.error, error]);

  // Optimize initial data fetching
  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
        const [tokensResponse, newTokenNo] = await Promise.all([
          fetchTokens(),
          generateTokenNumber()
        ]);
        
        if (newTokenNo) {
          dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo });
        }
        getCurrentDateTime();
      } catch (error) {
        dispatch({ type: 'SET_FIELD', field: 'error', value: error.message });
      } finally {
        dispatch({ type: 'SET_FIELD', field: 'loading', value: false });
      }
    };
    
    initializeData();
  }, []); // Empty dependencies array is correct here

  // Initialize filteredTokens with tokens - optimize with useMemo
  const filteredTokens = useMemo(() => {
    if (!state.searchQuery) {
      return tokens;
    }
    return state.filteredTokens;
  }, [tokens, state.searchQuery, state.filteredTokens]);

  const getCurrentDateTime = () => {
    const currentDate = new Date();
    
    // Date formatting similar to TokenTable
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Time formatting with leading zeros
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    dispatch({ type: 'SET_FIELD', field: 'date', value: formattedDate });
    dispatch({ type: 'SET_FIELD', field: 'time', value: formattedTime });
  };

  // Handle form field changes - memoize this handler
  const handleFieldChange = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // Handle code change with name fetch - optimize dependencies
  const handleCodeChange = useCallback(async (e) => {
    const inputCode = e.target.value;
    handleFieldChange('code', inputCode);

    if (inputCode.length === 4) {
      const fetchedName = await fetchNameByCode(inputCode);
      handleFieldChange('name', fetchedName);
    } else {
      handleFieldChange('name', '');
    }
  }, [handleFieldChange, fetchNameByCode]);

  const validateForm = useCallback(() => {
    if (state.code.length !== 4 || isNaN(state.code)) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Code must be a 4-digit number." });
      return false;
    }
    if (state.name === "Not Found") {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Name not found for the entered code." });
      return false;
    }
    if (state.weight <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Weight must be a positive number." });
      return false;
    }
    if (!state.sample) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Sample cannot be empty." });
      return false;
    }
    return true;
  }, [state.code, state.name, state.weight, state.sample]);

  // Optimize form submission with proper dependencies
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tokenData = {
      tokenNo: state.tokenNo,
      date: state.date,
      time: state.time,
      code: state.code,
      name: state.name,
      test: state.test,
      weight: parseFloat(state.weight).toFixed(3),
      sample: state.sample,
      amount: state.amount,
    };

    try {
      const success = await saveToken(tokenData, state.editMode ? state.editId : null);
      
      if (success) {
        // Immediately refresh the table data
        await fetchTokens();
        
        // If it was an edit operation
        if (state.editMode) {
          const newTokenNo = await generateTokenNumber();
          dispatch({ type: 'RESET_AFTER_EDIT', tokenNo: newTokenNo });
        } else {
          dispatch({ type: 'RESET_FORM' });
          await generateTokenNumber().then(newTokenNo => 
            dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo })
          );
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: error.message });
    }
  }, [state.tokenNo, state.date, state.time, state.code, state.name, 
      state.test, state.weight, state.sample, state.amount, 
      state.editMode, state.editId, validateForm, saveToken, 
      generateTokenNumber, fetchTokens]);

  // Add table refresh interval (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTokens();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchTokens]);

  // Reset form and generate new token number - optimize dependencies
  const resetForm = useCallback(async () => {
    try {
      const newTokenNo = await generateTokenNumber();
      dispatch({ 
        type: 'RESET_FORM',
        tokenNo: newTokenNo
      });
    } catch (error) {
      console.error('Error resetting form:', error);
      // Fallback to basic reset if token generation fails
      dispatch({ type: 'RESET_FORM' });
    }
  }, [generateTokenNumber]);

  const handlePrint = useCallback(async () => {
    try {
      const imagesToPreload = [logoPath];
      await preloadImages(imagesToPreload);
      const base64Logo = await convertImageToBase64(logoPath);
      
      const tokenData = {
        tokenNo: state.tokenNo,
        date: state.date,
        time: state.time,
        name: state.name,
        test: state.test,
        weight: state.weight,
        sample: state.sample,
        amount: state.amount
      };

      const printContent = generatePrintContent(tokenData, base64Logo);
      
      const printWindow = window.open('', '', 'width=800,height=400');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error('Print error:', error);
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'Failed to print token' });
    }
  }, [state.tokenNo, state.date, state.time, state.name, state.test, state.weight, state.sample, state.amount]);

  // Debounced search handler with memoization - optimize dependencies
  const handleSearch = useCallback(debounce((query) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_FIELD', field: 'filteredTokens', value: tokens });
      return;
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    // Memoize search results for the same query
    const cacheKey = `${query}-${tokens.length}`;
    
    if (searchCacheRef.current.has(cacheKey)) {
      dispatch({ type: 'SET_FIELD', field: 'filteredTokens', value: searchCacheRef.current.get(cacheKey) });
      return;
    }
    
    const filtered = tokens.filter(token => {
      const searchFields = [
        token.tokenNo?.toString() || '',
        token.code?.toString() || '',
        token.name || '',
        token.test || '',
        token.sample || '',
        token.weight?.toString() || '',
        token.amount?.toString() || ''
      ];

      return searchTerms.every(term => 
        searchFields.some(field => 
          field.toLowerCase().includes(term)
        )
      );
    });

    searchCacheRef.current.set(cacheKey, filtered);
    dispatch({ type: 'SET_FIELD', field: 'filteredTokens', value: filtered });
  }, 300), [tokens]);

  // Clear cache when tokens change - optimize this effect
  useEffect(() => {
    searchCacheRef.current.clear();
  }, [tokens]); // This is correct - we want to clear cache when tokens change

  // Cleanup debounce on unmount - fix dependency
  useEffect(() => {
    return () => {
      handleSearch.cancel();
    };
  }, [handleSearch]);

  // Memoize all handlers to prevent unnecessary re-renders
  const handlers = useMemo(() => ({
    handleEdit: (token) => {
      dispatch({ type: 'SET_EDIT_MODE', token });
    },
    handlePrint,
    handlePaymentStatusChange: async (tokenId, isPaid) => {
      const success = await updatePaymentStatus(tokenId, isPaid);
      if (success) {
        // Immediately refresh the table data after payment status change
        await fetchTokens();
      }
    },
    handleCodeChange,
    handleFieldChange: (field, value) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    handleConfirmDelete: async () => {
      if (!state.deleteConfirmation.tokenId) return;
      const success = await deleteToken(state.deleteConfirmation.tokenId);
      if (success) {
        // Immediately refresh the table data
        await fetchTokens();
        dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: false, tokenId: null } });
        dispatch({ type: 'RESET_FORM' });
        const newTokenNo = await generateTokenNumber();
        dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo });
      }
    }
  }), [handlePrint, updatePaymentStatus, fetchTokens, handleCodeChange, deleteToken, generateTokenNumber, state.deleteConfirmation.tokenId]);

  // Add error boundary wrapper
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong. Please try again.</div>}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <div className="container mx-auto px-4 py-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-amber-100 border-solid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BsReceipt className="w-6 h-6 text-amber-600 mr-3" />
                <h2 className="text-xl font-bold text-amber-900">
                  {state.editMode ? "Edit Token" : "New Token"}
                </h2>
              </div>
              {state.error && (
                <div className="p-1.5 bg-red-50 border-l-3 border-red-500 rounded">
                  <div className="flex">
                    <div className="ml-2">
                      <p className="text-xs text-red-700">{state.error}</p>
                    </div>
                  </div>
                </div>
              )}
              {success && (
                <div className="p-1.5 bg-green-50 border-l-3 border-green-500 border-solid rounded">
                  <div className="flex">
                    <div className="ml-2">
                      <p className="text-xs text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-3 bg-amber-50/50 rounded-lg border border-amber-100 border-solid"
              >
                <FormField
                  label="Token No"
                  icon={FiHash}
                  value={state.tokenNo}
                  readOnly
                  required
                  size="lg"
                />
                <FormField
                  label="Date"
                  icon={FiCalendar}
                  value={state.date}
                  readOnly
                  required
                  size="lg"
                />
                <FormField
                  label="Time"
                  icon={FiClock}
                  value={state.time}
                  readOnly
                  required
                  size="lg"
                />
                <FormField
                  label="Code"
                  icon={FiHash}
                  value={state.code}
                  onChange={handlers.handleCodeChange}
                  required
                  size="lg"
                />
                <FormField
                  label="Name"
                  icon={FiUser}
                  value={state.name}
                  readOnly={!state.editMode}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                  size="lg"
                />
                <FormSelect
                  label="Test"
                  icon={FiClipboard}
                  value={state.test}
                  onChange={(e) => handleFieldChange('test', e.target.value)}
                  options={["Skin Testing", "Photo Testing"]}
                  size="lg"
                />
                <FormField
                  label="Weight"
                  icon={FiPackage}
                  type="number"
                  step="0.001"
                  value={state.weight}
                  onChange={(e) => handleFieldChange('weight', e.target.value)}
                  required
                  size="lg"
                />
                <FormField
                  label="Sample"
                  icon={FiPackage}
                  value={state.sample}
                  onChange={(e) => handleFieldChange('sample', e.target.value)}
                  required
                  size="lg"
                />
                <FormField
                  label="Amount"
                  icon={FiDollarSign}
                  value={state.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  required
                  size="lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center px-3 py-1.5 text-sm border border-amber-200 border-solid text-amber-700 rounded-xl hover:bg-amber-50 transition-all"
                >
                  <FiRotateCcw className="mr-1.5 h-4 w-4" />
                  Reset
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-xl hover:from-amber-700 hover:to-yellow-600 transition-all"
                >
                  <FiSave className="mr-1.5 h-4 w-4" />
                  {state.editMode ? "Update Token" : "Save Token"}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-xl hover:from-amber-700 hover:to-yellow-600 transition-all"
                >
                  <FiPrinter className="mr-1.5 h-4 w-4" />
                  Print
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm p-4 border border-amber-100 border-solid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiList className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-bold text-amber-900">
                  Token List
                </h3>
              </div>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={state.searchQuery}
                  onChange={(e) => {
                    dispatch({ type: 'SET_FIELD', field: 'searchQuery', value: e.target.value });
                    handleSearch(e.target.value);
                  }}
                  onDoubleClick={resetForm}  // Add double-click to reset
                  className="w-full pl-8 pr-3 py-1.5 rounded border border-amber-200 border-solid focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm text-amber-900 rounded-xl"
                  title="Double click to reset search"  // Add tooltip
                />
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <TokenTable
                tokens={filteredTokens}
                onEdit={handlers.handleEdit}
                onDelete={(id) => dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: true, tokenId: id } })}
                onPaymentStatusChange={handlers.handlePaymentStatusChange}
              />
            )}
          </div>

          {state.deleteConfirmation.isOpen && (
            <Suspense fallback={<LoadingSpinner />}>
              <DeleteConfirmationModal
                onCancel={() => dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: false, tokenId: null } })}
                onConfirm={handlers.handleConfirmDelete}
              />
            </Suspense>
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

// Add ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Token page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default React.memo(TokenPage);