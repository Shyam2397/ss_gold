import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FiSearch,
  FiRotateCcw,
  FiList,
  FiHash,
  FiCalendar,
  FiClock,
  FiUser,
  FiPackage,
  FiPercent,
  FiStar,
  FiMessageSquare,
  FiX,
} from 'react-icons/fi';

import SkinTestForm from './components/SkinTestForm';
import TableRow from './components/TableRow';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { useSkinTest } from './hooks/useSkinTest';
import { initialFormData } from './constants/initialState';
import { printData } from './utils/printUtils';

// Fuzzy search helper function
const fuzzySearch = (query, text) => {
  if (!query) return true;
  
  const queryChars = query.toLowerCase().split('');
  let searchIndex = 0;
  const textLower = text?.toString().toLowerCase() || '';
  
  for (let i = 0; i < textLower.length; i++) {
    if (textLower[i] === queryChars[searchIndex]) {
      searchIndex++;
      if (searchIndex === queryChars.length) return true;
    }
  }
  return false;
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Grace period between a token resolving and focus moving to the first
// test-result field, so the operator can see the details that just populated.
const FOCUS_HIGHEST_DELAY_MS = 5000;

const SkinTesting = () => {
  const {
    formData,
    skinTests,
    isEditing,
    error,
    success,
    loading,
    sum,
    searchQuery,
    tokenDataVersion,
    tokenResolved,
    setSearchQuery,
    handleTokenChange,
    handleChange,
    handleSubmit,
    saveForm,
    handleEdit,
    handleDelete,
    handleReset,
    loadSkinTests,
  } = useSkinTest();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    itemId: null
  });
  const [printValuesOnly, setPrintValuesOnlyState] = useState(() => {
    try {
      const stored = window.localStorage.getItem('skinTest_printValuesOnly');
      return stored === 'true';
    } catch (e) {
      return false;
    }
  });

  const setPrintValuesOnly = useCallback((value) => {
    setPrintValuesOnlyState(value);
    try {
      window.localStorage.setItem('skinTest_printValuesOnly', String(value));
    } catch (e) {
      /* ignore */
    }
  }, []);

  const tokenInputRef = useRef(null);
  const highestInputRef = useRef(null);

  // The target input may not be mounted yet when this runs (a save reset
  // re-renders the field list, and a token lookup populates it a tick later),
  // so the focus is deferred a frame rather than applied inline.
  const focusField = useCallback((ref) => {
    const raf = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  const focusTokenInput = useCallback(() => focusField(tokenInputRef), [focusField]);
  const focusHighestInput = useCallback(() => focusField(highestInputRef), [focusField]);

  useEffect(() => {
    loadSkinTests();
  }, [loadSkinTests]);

  // Arriving on the page, or any time the current token is empty/invalid, the
  // token field is where typing belongs - there are no results to fill until a
  // token actually resolves.
  useEffect(() => {
    if (tokenResolved) return undefined;
    return focusTokenInput();
  }, [tokenResolved, focusTokenInput]);

  // A resolved token means the header details are filled; typing belongs in the
  // results grid from here on. The move is held back briefly so the fetched
  // name/weight/sample/phone land on screen before focus leaves the token field.
  // The timer dies with the effect, so it is cancelled the moment the token goes
  // unresolved (an empty field or a failed lookup) - focus never lands on a
  // stale target.
  useEffect(() => {
    if (!tokenResolved || tokenDataVersion === 0) return undefined;
    const timer = setTimeout(() => {
      focusHighestInput();
    }, FOCUS_HIGHEST_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [tokenResolved, tokenDataVersion, focusHighestInput]);

  // Saving clears the form back to a blank record, so hand focus back to token.
  useEffect(() => {
    if (!success) return undefined;
    return focusTokenInput();
  }, [success, focusTokenInput]);

  const handleResetAndFocus = useCallback(() => {
    handleReset();
    focusTokenInput();
  }, [handleReset, focusTokenInput]);

  // Memoize the filtered results with a stable reference
  const filteredSkinTests = React.useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    
    // Return all tests if search is empty
    if (!trimmedQuery) {
      return skinTests;
    }
    
    const query = trimmedQuery.toLowerCase();
    
    // Search across all relevant fields with fuzzy matching
    return skinTests.filter(test => {
      // Search in all relevant fields
      const searchableFields = [
        test.tokenNo?.toString() || test.token_no?.toString() || test.tokenno?.toString() || '',
        test.name || '',
        test.weight || '',
        test.sample || '',
        test.remarks || '',
        test.code || ''
      ];
      
      // Check if any field contains the query (fuzzy match)
      return searchableFields.some(field => 
        fuzzySearch(query, field)
      );
    });
  }, [skinTests, searchQuery]);
  
  // Memoized search handler with debouncing
  const handleSearch = useCallback(debounce((value) => {
    setSearchQuery(value);
  }, 200), []);
  
  // Clear search input
  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
  }, []);

  // Table rows reprint an already-saved record, so this stays print-only.
  const handlePrint = (data, valuesOnly) => {
    printData(data, valuesOnly ?? printValuesOnly);
  };

  // Save & Print: persist first, then print the snapshot the save returned.
  // Printing is gated on ok so a receipt is never produced for a record that
  // failed validation, clashed on token number, or hit a server error.
  //
  // The ref is the real guard. `loading` is reducer state that flips back to
  // false the moment the save resolves, but the print itself is still running,
  // and a second click in that gap would print twice.
  const savingAndPrintingRef = React.useRef(false);
  const handleSaveAndPrint = useCallback(async () => {
    if (savingAndPrintingRef.current) return;
    savingAndPrintingRef.current = true;
    try {
      const { ok, data } = await saveForm();
      if (ok) {
        await printData(data, printValuesOnly);
      }
    } catch (err) {
      // printData already logs its own failures; never surface a raw print
      // error over the form, and the save outcome is already in the banner.
      console.error('Save & print failed:', err);
    } finally {
      savingAndPrintingRef.current = false;
    }
  }, [saveForm, printValuesOnly]);
  
  // Memoize the table row component to prevent unnecessary re-renders
  const memoizedTableRow = React.useMemo(() => (
    <TableRow
      skinTests={filteredSkinTests}
      initialFormData={initialFormData}
      onEdit={handleEdit}
      onDelete={(id) => setDeleteConfirmation({ isOpen: true, itemId: id })}
      onPrint={handlePrint}
      searchQuery={searchQuery}
    />
  ), [filteredSkinTests, handleEdit, handlePrint, searchQuery]);

  // Use state for immediate feedback
  const [inputValue, setInputValue] = React.useState('');
  
  // Update search with debounce
  React.useEffect(() => {
    handleSearch(inputValue);
  }, [inputValue, handleSearch]);


  const customerFields = {
    tokenNo: '',
    date: '',
    time: '',
  };

  const tokenFields = {
    name: '',
    weight: '',
    sample: '',
  };

  const getFieldIcon = (key) => {
    const iconMap = {
      tokenNo: FiHash,
      date: FiCalendar,
      time: FiClock,
      name: FiUser,
      weight: FiPackage,
      sample: FiPackage,
      gold_fineness: FiPercent,
      karat: FiStar,
      remarks: FiMessageSquare
    };
    return iconMap[key.toLowerCase()] || null;
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Form Section */}
      <SkinTestForm
        formData={formData}
        isEditing={isEditing}
        error={error}
        success={success}
        loading={loading}
        sum={sum}
        handleTokenChange={handleTokenChange}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleReset={handleResetAndFocus}
        handleSaveAndPrint={handleSaveAndPrint}
        getFieldIcon={getFieldIcon}
        printValuesOnly={printValuesOnly}
        setPrintValuesOnly={setPrintValuesOnly}
        tokenInputRef={tokenInputRef}
        highestInputRef={highestInputRef}
      />

      {/* Test Results Table */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-amber-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FiList className="w-8 h-8 text-amber-600" />
            <h3 className="text-xl font-bold text-amber-900">
              Skin Test List
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="search"
                placeholder="Search by token, name, sample, remarks..."
                onChange={(e) => setInputValue(e.target.value)}
                value={inputValue}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm text-amber-900"
              />
              <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-amber-400 h-4 w-4" />
              {inputValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                  aria-label="Clear search"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetAndFocus}
                className="inline-flex items-center px-3 py-2 border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50 transition-all"
              >
                <FiRotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="min-h-[300px]">
          {memoizedTableRow}
        </div>
      </div>
      {deleteConfirmation.isOpen && (
        <DeleteConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onCancel={() => !loading && setDeleteConfirmation({ isOpen: false, itemId: null })}
          onConfirm={async () => {
            try {
              await handleDelete(deleteConfirmation.itemId);
              setDeleteConfirmation({ isOpen: false, itemId: null });
            } catch (error) {
              // Error is already handled in handleDelete
            }
          }}
        />
      )}
    </div>
  );
};

export default SkinTesting;
