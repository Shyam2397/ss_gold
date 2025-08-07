import React, { useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import {
  FiSearch,
  FiSave,
  FiRotateCcw,
  FiPrinter,
  FiAlertCircle,
  FiCheckCircle,
  FiList,
  FiHash,
  FiCalendar,
  FiClock,
  FiUser,
  FiPackage,
  FiPercent,
  FiStar,
  FiMessageSquare
} from 'react-icons/fi';
import { GiTestTubes } from 'react-icons/gi';

import SkinTestForm from './components/SkinTestForm';
import TableRow from './components/TableRow';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import {useSkinTest} from './hooks/useSkinTest';
import { initialFormData } from './constants/initialState';
import { formatDateForInput, formatTimeForInput } from './utils/validation';
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

  // Memoize the filtered results with a stable reference
  const filteredSkinTests = React.useMemo(() => {
    if (!searchQuery) return skinTests;
    
    const query = searchQuery.toLowerCase();
    return skinTests.filter((test) =>
      Object.entries(test).some(([key, value]) => {
        // Skip tokenNo field from search to prevent re-renders when tokenNo changes
        if (key.toLowerCase() === 'tokenno') return false;
        
        return value !== null && 
               value !== undefined && 
               value.toString().toLowerCase().includes(query);
      })
    );
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



  const debouncedSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (e) => {
    debouncedSearchChange(e.target.value);
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
                value={searchQuery}
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
          onCancel={() => setDeleteConfirmation({ isOpen: false, itemId: null })}
          onConfirm={() => {
            handleDelete(deleteConfirmation.itemId);
            setDeleteConfirmation({ isOpen: false, itemId: null });
          }}
        />
      )}
    </div>
  );
};

export default SkinTesting;
