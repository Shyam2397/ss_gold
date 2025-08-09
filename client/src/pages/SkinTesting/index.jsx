import React, { useEffect, useState } from 'react';
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
} from 'react-icons/fi';


import SkinTestForm from './components/SkinTestForm';
import TableRow from './components/TableRow';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import {useSkinTest} from './hooks/useSkinTest';
import { initialFormData } from './constants/initialState';
import { printData } from './utils/printUtils';

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

  // Use ref to store the previous search results
  const prevSearchRef = React.useRef('');
  const prevResultsRef = React.useRef(skinTests);
  
  // Memoize the filtered results with a stable reference
  const filteredSkinTests = React.useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    
    // Return all tests if search is empty
    if (!trimmedQuery) {
      prevSearchRef.current = '';
      prevResultsRef.current = skinTests;
      return skinTests;
    }
    
    // Check if we can use previous results for incremental search
    if (trimmedQuery.startsWith(prevSearchRef.current) && prevSearchRef.current !== '') {
      // If new search is an extension of previous search, filter previous results
      const query = trimmedQuery.toLowerCase();
      const results = prevResultsRef.current.filter(test => 
        test.tokenNo?.toString().toLowerCase().includes(query) ||
        test.name?.toString().toLowerCase().includes(query) ||
        test.sample?.toString().toLowerCase().includes(query) ||
        test.remarks?.toString().toLowerCase().includes(query)
      );
      
      prevSearchRef.current = trimmedQuery;
      prevResultsRef.current = results;
      return results;
    }
    
    // Full search
    const query = trimmedQuery.toLowerCase();
    const results = skinTests.filter(test => 
      test.tokenNo?.toString().toLowerCase().includes(query) ||
      test.name?.toString().toLowerCase().includes(query) ||
      test.sample?.toString().toLowerCase().includes(query) ||
      test.remarks?.toString().toLowerCase().includes(query)
    );
    
    prevSearchRef.current = trimmedQuery;
    prevResultsRef.current = results;
    return results;
  }, [skinTests, searchQuery]);

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
    />
  ), [filteredSkinTests, handleEdit, handlePrint]);



  // Use state for immediate feedback
  const [inputValue, setInputValue] = React.useState('');
  
  // Update search with debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 100); // Reduced debounce time to 100ms
    
    return () => clearTimeout(handler);
  }, [inputValue]);
  
  const handleSearchChange = (e) => {
    // Update input immediately for better UX
    setInputValue(e.target.value);
  };


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
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search tests..."
                onChange={handleSearchChange}
                value={inputValue}
                className="w-full pl-8 pr-3 py-2 rounded border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm text-amber-900"
              />
              <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
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
