import React, { useReducer, useEffect, useMemo, useCallback, Suspense } from "react";
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

// Components
import {
  FormField,
  FormSelect,
  TokenTable,
  DeleteConfirmationModal,
  LoadingSpinner
} from './components/LazyComponents';

// Hooks
import useToken from './hooks/useTokenQuery';

// Utils
import { preloadImages, convertImageToBase64, generatePrintContent } from './utils/printUtils';

import { tokenReducer, initialState } from './reducers/tokenReducer';

const TokenPage = () => {
  const [state, dispatch] = useReducer(tokenReducer, initialState);
  
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
  }, []); // Remove dependencies since we're handling everything in the effect

  // Initialize filteredTokens with tokens
  useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'filteredTokens', value: tokens });
  }, [tokens]);

  // Search filter
  useEffect(() => {
    if (state.searchQuery.trim() === '') {
      dispatch({ type: 'SET_FIELD', field: 'filteredTokens', value: tokens });
    } else {
      dispatch({
        type: 'SET_FIELD',
        field: 'filteredTokens',
        value: tokens.filter((token) =>
          Object.values(token)
            .join(" ")
            .toLowerCase()
            .includes(state.searchQuery.toLowerCase())
        )
      });
    }
  }, [state.searchQuery, tokens]);

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

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  // Handle code change with name fetch
  const handleCodeChange = useCallback(async (e) => {
    const inputCode = e.target.value;
    handleFieldChange('code', inputCode);

    if (inputCode.length === 4) {
      const fetchedName = await fetchNameByCode(inputCode);
      handleFieldChange('name', fetchedName);
    } else {
      handleFieldChange('name', '');
    }
  }, [fetchNameByCode]);

  const validateForm = () => {
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
  };

  // Optimize form submission with immediate table refresh
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
  }, [state, validateForm, saveToken, generateTokenNumber, fetchTokens]);

  // Add table refresh interval (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTokens();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchTokens]);

  const handleEdit = useCallback((token) => {
    dispatch({ type: 'SET_EDIT_MODE', token });
  }, []);

  const handleConfirmDelete = async () => {
    if (!state.deleteConfirmation.tokenId) return;

    const success = await deleteToken(state.deleteConfirmation.tokenId);
    
    if (success) {
      // Immediately refresh the table data
      await fetchTokens();
      
      dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: false, tokenId: null } });
      resetForm();
      generateTokenNumber().then((newTokenNo) => dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo }));
    }
  };

  // Batch state updates
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const handlePrint = async () => {
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
      
      const printWindow = window.open('', '', 'width=1200,height=600');
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
  };

  const handlePaymentStatusChange = async (tokenId, isPaid) => {
    const success = await updatePaymentStatus(tokenId, isPaid);
    if (success) {
      // Immediately refresh the table data after payment status change
      await fetchTokens();
    }
  };

  // Add memoization for expensive operations
  const memoizedTokenData = useMemo(() => ({
    tokenNo: state.tokenNo,
    date: state.date,
    time: state.time,
    name: state.name,
    test: state.test,
    weight: state.weight,
    sample: state.sample,
    amount: state.amount
  }), [state.tokenNo, state.date, state.time, state.name, state.test, state.weight, state.sample, state.amount]);

  // Optimize search with debounce and memo
  const debouncedSearch = useMemo(() => 
    debounce((query) => {
      dispatch({ type: 'SET_FIELD', field: 'searchQuery', value: query });
    }, 300),
    []
  );

  // Memoize all handlers
  const handlers = useMemo(() => ({
    handleEdit,
    handlePrint,
    handlePaymentStatusChange,
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
        dispatch({ type: 'SET_DELETE_CONFIRMATION', value: { isOpen: false, tokenId: null } });
        dispatch({ type: 'RESET_FORM' });
        const newTokenNo = await generateTokenNumber();
        dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo });
      }
    }
  }), [state.deleteConfirmation.tokenId, deleteToken, generateTokenNumber]);

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
              {error && (
                <div className="p-1.5 bg-red-50 border-l-3 border-red-500 rounded">
                  <div className="flex">
                    <div className="ml-2">
                      <p className="text-xs text-red-700">{error}</p>
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
                  onChange={handleCodeChange}
                  required
                  size="lg"
                />
                <FormField
                  label="Name"
                  icon={FiUser}
                  value={state.name}
                  readOnly
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
                  onChange={(e) => debouncedSearch(e.target.value)}
                  onDoubleClick={resetForm}  // Add double-click to reset
                  className="w-full pl-8 pr-3 py-1.5 rounded border border-amber-200 border-solid focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm text-amber-900"
                  title="Double click to reset search"  // Add tooltip
                />
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <TokenTable
                tokens={state.filteredTokens}
                onEdit={handleEdit}
                onDelete={(id) => dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: true, tokenId: id } })}
                onPaymentStatusChange={handlePaymentStatusChange}
              />
            )}
          </div>

          {state.deleteConfirmation.isOpen && (
            <DeleteConfirmationModal
              onCancel={() => dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: false, tokenId: null } })}
              onConfirm={handleConfirmDelete}
            />
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
