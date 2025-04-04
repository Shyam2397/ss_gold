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

import FormInput from './components/FormInput';
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
  const [filteredSkinTests, setFilteredSkinTests] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    itemId: null
  });

  useEffect(() => {
    loadSkinTests();
  }, [loadSkinTests]);

  useEffect(() => {
    setFilteredSkinTests(
      skinTests.filter((test) =>
        Object.values(test).some((value) =>
          value !== null && value !== undefined && 
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    );
  }, [skinTests, searchQuery]);

  const debouncedSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (e) => {
    debouncedSearchChange(e.target.value);
  };

  const handlePrint = (data) => {
    printData(data);
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
      <div className="bg-white rounded-lg shadow-sm p-4 border border-amber-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <GiTestTubes className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-amber-900">Skin Testing</h2>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-2">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="p-2 bg-green-50 border-l-4 border-green-500 rounded">
              <div className="flex">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-2">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer and Token Fields */}
          <div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100 shadow-sm"
          >
            {[...Object.keys(customerFields), ...Object.keys(tokenFields)].sort((a, b) => {
              const order = [
                'tokenNo', 'date', 'time', 
                'name', 'weight', 'sample'
              ];
              return order.indexOf(a) - order.indexOf(b);
            }).map((key) => {
              let inputValue = formData[key] || '';
              let inputType = 'text';
              
              // Format date and time for input fields
              if (key === 'date') {
                inputType = 'date';
                inputValue = formatDateForInput(inputValue);
              } else if (key === 'time') {
                inputType = 'time';
                inputValue = formatTimeForInput(inputValue);
              }

              return (
                <FormInput
                  key={key}
                  label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  name={key}
                  value={inputValue}
                  onChange={key === 'tokenNo' ? handleTokenChange : handleChange}
                  icon={key === 'tokenNo' ? FiHash : getFieldIcon(key)}
                  size="base"
                  readOnly={isEditing && key === 'tokenNo'}
                  placeholder={key === 'tokenNo' ? 'Enter token number' : ''}
                  type={inputType}
                />
              );
            })}
          </div>

          {/* Test Results*/}
          <div 
            className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-4 ${loading ? 'opacity-50' : ''}`}
          >
            {Object.keys(formData)
              .filter(key => {
                const excludedFields = [
                  'tokenNo', 'tokenno', // Exclude both cases of token number
                  'date', 'time', 'name', 'weight', 
                  'sample', 'code', 'phoneNumber'
                ];
                // Also exclude any key that contains 'token' (case insensitive)
                return !excludedFields.includes(key) && 
                  !Object.keys(customerFields).includes(key) && 
                  !Object.keys(tokenFields).includes(key) &&
                  !/token/i.test(key);
              })
              .map((key) => (
                <FormInput
                  key={key}
                  label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  icon={getFieldIcon(key)}
                  size="base"
                  readOnly={loading}
                />
              ))}
          </div>

          <div className="flex justify-end space-x-3">
            {sum > 0 && (
              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                <div className="flex">
                  <div className="ml-2">
                    <p className="text-sm font-medium text-amber-800">
                      Total Sum: {sum.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-3 py-2 border border-amber-200 text-amber-700 rounded-2xl hover:bg-amber-50 transition-all"
            >
              <FiRotateCcw className="mr-2 h-4 w-4" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-2xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all"
            >
              <FiSave className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Test' : 'Save Test'}
            </button>
            <button
              onClick={() => handlePrint(formData)}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-2xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all"
            >
              <FiPrinter className="mr-2 h-4 w-4" />
              Print
            </button>
          </div>
        </form>
      </div>

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

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <TableRow
            skinTests={filteredSkinTests}
            initialFormData={initialFormData}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirmation({ isOpen: true, itemId: id })}
            onPrint={handlePrint}
          />
        )}
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
