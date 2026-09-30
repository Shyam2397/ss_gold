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
  DeleteConfirmationModal,
  LoadingSpinner
} from './components/LazyComponents';

// Hooks
import useToken from './hooks/useTokenQuery';

// Utils
import { preloadImages, convertImageToBase64, generatePrintContent } from './utils/printUtils';

import { tokenReducer, initialState } from './reducers/tokenReducer';

// A stable reference: an inline array literal gave FormSelect a new `options`
// prop on every render, which defeated its memo comparison.
const TEST_OPTIONS = ["Skin Testing", "Photo Testing"];

// A logo failure must never block saving/printing - fall back to printing without it
const preparePrintLogo = async () => {
  try {
    await preloadImages([logoPath]);
    return await convertImageToBase64(logoPath);
  } catch (err) {
    console.error('Logo could not be prepared, printing without it:', err);
    return null;
  }
};

// The logo never changes, so decode it once per session instead of on every
// print. `null` = not resolved yet, `false` = unavailable.
let printLogoCache = null;
const getPrintLogo = () => {
  if (printLogoCache !== null) {
    return Promise.resolve(printLogoCache || null);
  }
  return preparePrintLogo().then((base64) => {
    printLogoCache = base64 || false;
    return base64 || null;
  });
};

const FONT_WAIT_TIMEOUT = 3000;

// Resolves once the print document's webfonts are usable, or after the timeout
// if they never arrive. Never rejects - printing must still be attempted.
const waitForFonts = (printWindow) => {
  const fontsReady = printWindow.document.fonts?.ready;
  if (!fontsReady || typeof fontsReady.then !== 'function') {
    return Promise.resolve();
  }
  return Promise.race([
    fontsReady.catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, FONT_WAIT_TIMEOUT))
  ]);
};

const TokenPage = () => {
  const [state, dispatch] = useReducer(tokenReducer, initialState);
  const searchCacheRef = useRef(new Map());
  const codeInputRef = useRef(null);
  const hasAutoFocusedCodeRef = useRef(false);
  const isBusyRef = useRef(false);
  const isDeleteBusyRef = useRef(false);
  const codeLookupIdRef = useRef(0);
  const clockIntervalRef = useRef(null);
  const editModeRef = useRef(state.editMode);
  const MESSAGE_TIMEOUT = 5000; // 5 seconds

  // Mirrored into a ref in an effect rather than during render: writing to a ref
  // while rendering is a side effect and is unsafe under concurrent rendering.
  useEffect(() => {
    editModeRef.current = state.editMode;
  }, [state.editMode]);

  // Auto-focus the Code input on mount (page load / navigation).
  // Uses a callback ref because FormField is lazy-loaded, so the node only
  // exists after the chunk resolves.
  const attachCodeInputRef = useCallback((node) => {
    codeInputRef.current = node;
    if (node && !hasAutoFocusedCodeRef.current) {
      hasAutoFocusedCodeRef.current = true;
      requestAnimationFrame(() => {
        if (codeInputRef.current && document.activeElement !== codeInputRef.current) {
          codeInputRef.current.focus();
        }
      });
    }
  }, []);

  // Focus the Code input after the form is cleared. Deferred to the next frame
  // so it runs after the reset re-render has committed the empty value.
  const focusCodeInput = useCallback(() => {
    requestAnimationFrame(() => {
      const node = codeInputRef.current;
      if (node && document.activeElement !== node) {
        node.focus();
        if (typeof node.select === 'function') node.select();
      }
    });
  }, []);

  // Custom hook for token operations
  const {
    tokens,
    loading,
    error,
    success,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
    updatePaymentStatus
  } = useToken();

  // Clear local error messages after timeout. The hook owns its own error
  // state and timer, so this only handles errors raised by the form itself.
  useEffect(() => {
    let localErrorTimer;
    if (state.error) {
      localErrorTimer = setTimeout(() => {
        dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
      }, MESSAGE_TIMEOUT);
    }
    return () => {
      if (localErrorTimer) clearTimeout(localErrorTimer);
    };
  }, [state.error]);

  // Live clock - updates time field every minute (aligned to actual minute boundaries)
  // Skips updates when in edit mode to preserve the token's original time
  useEffect(() => {
    const updateClock = () => {
      if (editModeRef.current) return; // Don't overwrite edited token's time
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      dispatch({ type: 'SET_FIELD', field: 'time', value: `${hours}:${minutes}` });
    };

    // Update immediately
    updateClock();

    // Align to the next minute boundary, then tick every 60s
    const now = new Date();
    const msUntilNextMinute = Math.max((60 - now.getSeconds()) * 1000 - now.getMilliseconds(), 0);

    const timeout = setTimeout(() => {
      updateClock();
      clockIntervalRef.current = setInterval(updateClock, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
        clockIntervalRef.current = null;
      }
    };
  }, []);

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

  // Seed the form with the first token number and today's date. The token list
  // itself is fetched by the query hook, so there is nothing to await here.
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        getCurrentDateTime();
        const newTokenNo = await generateTokenNumber();
        if (isMounted && newTokenNo) {
          dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo });
        } else if (isMounted) {
          dispatch({
            type: 'SET_FIELD',
            field: 'error',
            value: 'Could not generate the next token number. Please try again.'
          });
        }
      } catch (error) {
        if (isMounted) {
          dispatch({ type: 'SET_FIELD', field: 'error', value: error.message });
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [generateTokenNumber]);

  // Initialize filteredTokens with tokens - optimize with useMemo
  const filteredTokens = useMemo(() => {
    if (!state.searchQuery) {
      return tokens;
    }
    return state.filteredTokens;
  }, [tokens, state.searchQuery, state.filteredTokens]);

  // Handle form field changes - memoize this handler
  const handleFieldChange = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // Returns one stable change handler per field. Inline arrows here gave the
  // memoized FormField/FormSelect a new onChange on every render, so they
  // re-rendered on each keystroke regardless of value.
  const fieldChangeHandler = useMemo(() => {
    const cache = new Map();
    return (field) => {
      if (!cache.has(field)) {
        cache.set(field, (e) => handleFieldChange(field, e.target.value));
      }
      return cache.get(field);
    };
  }, [handleFieldChange]);

  // Handle code change with name fetch - optimize dependencies
  const handleCodeChange = useCallback(async (e) => {
    const inputCode = e.target.value;
    handleFieldChange('code', inputCode);

    if (inputCode.length === 4) {
      // Lookups are not cancellable, so a slow earlier request could land after
      // a newer one and overwrite it with a stale name. Only the latest
      // lookup is allowed to write to the form.
      const requestId = ++codeLookupIdRef.current;
      try {
        const fetchedName = await fetchNameByCode(inputCode);
        if (codeLookupIdRef.current !== requestId) return;
        handleFieldChange('name', fetchedName);
      } catch (error) {
        if (codeLookupIdRef.current !== requestId) return;
        handleFieldChange('name', 'Not Found');
      }
    } else {
      // Invalidate any lookup still in flight for a now-invalid code.
      codeLookupIdRef.current += 1;
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
    if (state.weight === '' || state.weight === null || state.weight === undefined) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Weight is required." });
      return false;
    }
    // NaN fails every comparison, so it has to be rejected explicitly rather
    // than relying on the <= 0 check below.
    if (Number.isNaN(Number(state.weight))) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Weight must be a number." });
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
    if (state.amount === '' || state.amount === null || state.amount === undefined) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Amount is required." });
      return false;
    }
    if (Number.isNaN(Number(state.amount))) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Amount must be a number." });
      return false;
    }
    if (state.amount < 0) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Amount cannot be negative." });
      return false;
    }
    return true;
  }, [state.code, state.name, state.weight, state.sample, state.amount]);

  const getTokenData = useCallback(() => ({
    tokenNo: state.tokenNo,
    date: state.date,
    time: state.time,
    code: state.code,
    name: state.name,
    test: state.test,
    // Send numbers, not pre-formatted strings, so the DECIMAL columns receive
    // a well-typed value instead of a string that has to be re-parsed.
    weight: Number(state.weight).toFixed(3),
    sample: state.sample,
    amount: Number(state.amount).toFixed(2)
  }), [state.tokenNo, state.date, state.time, state.code, state.name, state.test, state.weight, state.sample, state.amount]);

  const resetAfterSave = useCallback(async () => {
    // Clear the fields first and let the next token number arrive afterwards,
    // so the operator is never left staring at a form waiting on the network.
    // The token number is blanked rather than carried over: the previous one has
    // just been consumed, and leaving it on screen invites a duplicate save.
    if (state.editMode) {
      dispatch({ type: 'RESET_AFTER_EDIT', tokenNo: '' });
    } else {
      dispatch({ type: 'RESET_FORM', tokenNo: '' });
    }

    focusCodeInput();

    const newTokenNo = await generateTokenNumber();
    if (newTokenNo) {
      dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo });
    } else {
      dispatch({
        type: 'SET_FIELD',
        field: 'error',
        value: 'Could not generate the next token number. Please try again before saving.'
      });
    }
  }, [state.editMode, generateTokenNumber, focusCodeInput]);

  // Optimize form submission with proper dependencies
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isBusyRef.current) return; // Guard against double submits (click + Enter)
    if (!validateForm()) return;

    const tokenData = getTokenData();

    isBusyRef.current = true;
    dispatch({ type: 'SET_FIELD', field: 'isBusy', value: true });

    try {
      const saved = await saveToken(tokenData, state.editMode ? state.editId : null);

      if (saved) {
        // The mutation already merged the new row into the query cache and the
        // query refetches on its own interval, so no refetch is needed here.
        resetAfterSave();
      }
    } catch (error) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: error.message });
    } finally {
      isBusyRef.current = false;
      dispatch({ type: 'SET_FIELD', field: 'isBusy', value: false });
    }
  }, [getTokenData, state.editMode, state.editId, validateForm, saveToken, resetAfterSave]);

  // Reset form and generate new token number - optimize dependencies
  const resetForm = useCallback(async () => {
    try {
      const newTokenNo = await generateTokenNumber();
      dispatch({
        type: 'RESET_FORM',
        tokenNo: newTokenNo
      });
      if (!newTokenNo) {
        dispatch({
          type: 'SET_FIELD',
          field: 'error',
          value: 'Could not generate the next token number. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error resetting form:', error);
      // Fallback to basic reset if token generation fails. The previous number
      // is still unused here, so keeping it is safe.
      dispatch({ type: 'RESET_FORM' });
    }
    focusCodeInput();
  }, [generateTokenNumber, focusCodeInput]);

  const handlePrint = useCallback(async () => {
    if (isBusyRef.current) return;
    if (!validateForm()) return;

    const tokenData = getTokenData();
    const isElectronEnv = !!(window.electron && window.electron.isElectron);

    // The print window has to be opened synchronously, while we still hold the
    // user activation. Any await before window.open() lets the popup blocker
    // reject it, which would leave the token saved but never printed.
    let printWindow = null;
    if (!isElectronEnv) {
      printWindow = window.open('', '', 'width=800,height=400');
      if (!printWindow) {
        dispatch({
          type: 'SET_FIELD',
          field: 'error',
          value: 'Print window was blocked. Allow pop-ups for this page and try again.'
        });
        return;
      }
      printWindow.document.open();
      printWindow.document.write('<!doctype html><html><body></body></html>');
      printWindow.document.close();
    }

    isBusyRef.current = true;
    dispatch({ type: 'SET_FIELD', field: 'isBusy', value: true });

    let saved = false;
    try {
      // Save and logo decoding run in parallel - neither has to wait for the
      // other, and the receipt only needs both to be ready before printing.
      const [, saveResult] = await Promise.all([
        getPrintLogo(),
        saveToken(tokenData, state.editMode ? state.editId : null)
      ]);
      saved = !!saveResult;
      if (!saved) {
        // Error already surfaced by useToken; keep the form so it can be retried
        if (printWindow && !printWindow.closed) printWindow.close();
        return;
      }

      // Reset the form as soon as the token is stored so the next entry can be
      // typed straight away. The mutation's cache update plus the query's own
      // refetch interval keep the list fresh, so nothing is refetched here.
      resetAfterSave();

      const printContent = generatePrintContent(tokenData, await getPrintLogo());

      if (isElectronEnv) {
        dispatch({ type: 'SET_FIELD', field: 'success', value: 'Sending to printer...' });
        const result = await window.electron.silentPrintToken(printContent);
        if (!result || !result.success) {
          throw new Error((result && result.error) || 'Silent print failed');
        }
        dispatch({ type: 'SET_FIELD', field: 'success', value: 'Token printed successfully!' });
        setTimeout(() => {
          dispatch({ type: 'SET_FIELD', field: 'success', value: '' });
        }, 3000);
      } else {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Wait for the webfonts rather than a fixed 250ms. The receipt pulls
        // Poppins/Allura from fonts.googleapis.com, so a fixed delay printed the
        // fallback font whenever the network was slower than that - and silently
        // did so every time when offline. document.fonts.ready settles once the
        // stylesheet has loaded and the faces are usable, with a cap so a hung
        // request cannot block the print indefinitely.
        await waitForFonts(printWindow);
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      console.error('Print error:', error);
      dispatch({
        type: 'SET_FIELD',
        field: 'error',
        value: 'Failed to print token: ' + (error.message || 'Unknown error') + (saved ? ' The token was saved.' : '')
      });
    } finally {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      isBusyRef.current = false;
      dispatch({ type: 'SET_FIELD', field: 'isBusy', value: false });
    }
  }, [getTokenData, state.editMode, state.editId, validateForm, saveToken, resetAfterSave]);

  // Debounced search. useCallback(debounce(...)) re-ran debounce() on every
  // render and threw away all but the newest instance; useMemo keeps exactly one
  // per tokens change, and the effect below cancels it on unmount.
  const handleSearch = useMemo(
    () =>
      debounce((query) => {
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
      }, 300),
    [tokens]
  );

  // Clear cache when tokens change - optimize this effect
  useEffect(() => {
    searchCacheRef.current.clear();
  }, [tokens]); // This is correct - we want to clear cache when tokens change

  // Keeping the query in reducer state and the filtering in a debounced ref
  // means an inline handler would rebuild the debounce on every keystroke.
  const handleSearchInput = useCallback((e) => {
    const query = e.target.value;
    dispatch({ type: 'SET_FIELD', field: 'searchQuery', value: query });
    handleSearch(query);
  }, [handleSearch]);

  // Cleanup debounce on unmount
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
      // The mutation already patches the query cache on success. Patching
      // filteredTokens here as well meant a second, competing copy of the row
      // that the next refetch would silently overwrite.
      const updated = await updatePaymentStatus(tokenId, isPaid);
      if (!updated) {
        dispatch({ type: 'SET_FIELD', field: 'error', value: 'Could not update the payment status.' });
      }
    },
    handleCodeChange,
    handleOpenDelete: (id) => {
      dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: true, tokenId: id } });
    },
    handleCancelDelete: () => {
      dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: false, tokenId: null } });
    },
    handleConfirmDelete: async () => {
      if (!state.deleteConfirmation.tokenId) return;
      // The modal stays mounted until the request resolves, so a double click
      // would otherwise fire two DELETEs for the same id.
      if (isDeleteBusyRef.current) return;
      isDeleteBusyRef.current = true;

      try {
        dispatch({ type: 'SET_FIELD', field: 'isDeleting', value: true });
        const deleted = await deleteToken(state.deleteConfirmation.tokenId);
        if (deleted) {
          dispatch({ type: 'SET_FIELD', field: 'deleteConfirmation', value: { isOpen: false, tokenId: null } });
          dispatch({ type: 'RESET_FORM', tokenNo: '' });
          const newTokenNo = await generateTokenNumber();
          if (newTokenNo) {
            dispatch({ type: 'SET_FIELD', field: 'tokenNo', value: newTokenNo });
          }
          focusCodeInput();
        }
      } finally {
        isDeleteBusyRef.current = false;
        dispatch({ type: 'SET_FIELD', field: 'isDeleting', value: false });
      }
    }
  }), [handlePrint, updatePaymentStatus, handleCodeChange, deleteToken, generateTokenNumber, state.deleteConfirmation.tokenId, focusCodeInput]);

  // Add error boundary wrapper
  return (
    <ErrorBoundary
      fallback="Something went wrong. Please try again."
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
              {(state.error || error) && (
                <div
                  className="p-1.5 bg-red-50 border-l-3 border-red-500 rounded"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex">
                    <div className="ml-2">
                      <p className="text-xs text-red-700">{state.error || error}</p>
                    </div>
                  </div>
                </div>
              )}
              {success && (
                <div
                  className="p-1.5 bg-green-50 border-l-3 border-green-500 border-solid rounded"
                  role="status"
                  aria-live="polite"
                >
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
                />
                <FormField
                  label="Date"
                  icon={FiCalendar}
                  value={state.date}
                  readOnly
                  required
                />
                <FormField
                  label="Time"
                  icon={FiClock}
                  value={state.time}
                  readOnly
                  required
                />
                <FormField
                  label="Code"
                  icon={FiHash}
                  value={state.code}
                  onChange={handlers.handleCodeChange}
                  inputRef={attachCodeInputRef}
                  required
                />
                <FormField
                  label="Name"
                  icon={FiUser}
                  value={state.name}
                  readOnly={!state.editMode}
                  onChange={fieldChangeHandler('name')}
                  required
                />
                <FormSelect
                  label="Test"
                  icon={FiClipboard}
                  value={state.test}
                  onChange={fieldChangeHandler('test')}
                  options={TEST_OPTIONS}
                />
                <FormField
                  label="Weight"
                  icon={FiPackage}
                  type="number"
                  step="0.001"
                  value={state.weight}
                  onChange={fieldChangeHandler('weight')}
                  required
                />
                <FormField
                  label="Sample"
                  icon={FiPackage}
                  value={state.sample}
                  onChange={fieldChangeHandler('sample')}
                  required
                />
                <FormField
                  label="Amount"
                  icon={FiDollarSign}
                  value={state.amount}
                  onChange={fieldChangeHandler('amount')}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={state.isBusy}
                  className="inline-flex items-center px-3 py-1.5 text-sm border border-amber-200 border-solid text-amber-700 rounded-xl hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <FiRotateCcw className="mr-1.5 h-4 w-4" />
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={state.isBusy}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-xl hover:from-amber-700 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="mr-1.5 h-4 w-4" />
                  {state.editMode ? "Update Token" : "Save Token"}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={state.isBusy}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-xl hover:from-amber-700 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPrinter className="mr-1.5 h-4 w-4" />
                  {state.isBusy ? "Saving & Printing..." : "Save and Print"}
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
                <label htmlFor="token-search" className="sr-only">Search tokens</label>
                <input
                  id="token-search"
                  type="search"
                  placeholder="Search tokens..."
                  value={state.searchQuery}
                  onChange={handleSearchInput}
                  onDoubleClick={resetForm}
                  className="w-full pl-8 pr-3 py-1.5 rounded border border-amber-200 border-solid focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm text-amber-900 rounded-xl"
                  title="Double click to reset search"
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
                onDelete={handlers.handleOpenDelete}
                onPaymentStatusChange={handlers.handlePaymentStatusChange}
              />
            )}
          </div>

          {state.deleteConfirmation.isOpen && (
            <Suspense fallback={<LoadingSpinner />}>
              <DeleteConfirmationModal
                onCancel={handlers.handleCancelDelete}
                onConfirm={handlers.handleConfirmDelete}
                isBusy={state.isDeleting}
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

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center" role="alert">
          <p className="text-sm text-red-700">{this.props.fallback}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default React.memo(TokenPage);