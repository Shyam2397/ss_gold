import React, { useEffect, useState, useCallback } from 'react';
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
    setSearchQuery,
    handleTokenChange,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleReset,
    loadSkinTests,
  } = useSkinTest();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    itemId: null
  });

  useEffect(() => {
    loadSkinTests();
  }, [loadSkinTests]);

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

  const handlePrint = (data) => {
    printData(data);
  };
  
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
        handleReset={handleReset}
        handlePrint={handlePrint}
        getFieldIcon={getFieldIcon}
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
                onClick={handleReset}
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
