import React, { useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import {
  FiSearch,
  FiSave,
  FiRotateCcw,
  FiPrinter,
  FiAlertCircle,
  FiList
} from 'react-icons/fi';
import { GiTestTubes } from 'react-icons/gi';

import FormInput from './components/FormInput';
import TableRow from './components/TableRow';
import LoadingSpinner from './components/LoadingSpinner';
import useSkinTest from './hooks/useSkinTest';
import { initialFormData } from './constants/initialState';

const SkinTesting = () => {
  const {
    formData,
    skinTests,
    isEditing,
    error,
    loading,
    sum,
    handleTokenChange,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleReset,
    loadSkinTests,
  } = useSkinTest();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSkinTests, setFilteredSkinTests] = useState([]);

  useEffect(() => {
    loadSkinTests();
  }, [loadSkinTests]);

  useEffect(() => {
    setFilteredSkinTests(
      skinTests.filter((test) =>
        Object.values(test).some((value) =>
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

  const handlePrint = () => {
    const printWindow = window.open('width=1200,height=800');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @media print {
              .print-area {
                width: 210mm;
                height: 99mm;
                margin: 0;
                border: 1px solid #000;
                box-sizing: border-box;
              }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
        ${document.getElementById('print-content').innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <GiTestTubes className="w-9 h-9 sm:w-11 sm:h-11 text-amber-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-900">Skin Testing</h2>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <FiAlertCircle className="h-6 w-6 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm sm:text-base text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer and Token Information */}
          <div 
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-4 sm:p-6 bg-amber-50 rounded-xl border border-amber-100 shadow-sm"
          >
            {[...Object.keys(customerFields), ...Object.keys(tokenFields)].sort((a, b) => {
              const order = [
                'tokenNo', 'date', 'time', 
                'name', 'weight', 'sample'
              ];
              return order.indexOf(a) - order.indexOf(b);
            }).map((key, index) => (
              <FormInput
                key={key}
                label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                name={key}
                value={formData[key] || ''}
                onChange={handleChange}
                size={index < 3 ? "base" : "base"}
              />
            ))}
          </div>

          {/* Test Results */}
          <div 
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3"
          >
            {Object.keys(formData)
              .filter(
                (key) =>
                  ![
                    'tokenNo',
                    'date',
                    'time',
                    'name',
                    'weight',
                    'sample',
                    'code',
                  ].includes(key)
              )
              .map((key) => (
                <FormInput
                  key={key}
                  label={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  size="lg"
                />
              ))}
          </div>

          <div className="flex justify-end space-x-4 sm:space-x-6">
            {sum > 0 && (
              <div className="p-4 sm:p-6 bg-amber-50 border-l-4 border-amber-500 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm sm:text-base font-medium text-amber-800">
                      Total Sum: {sum.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
            >
              <FiRotateCcw className="-ml-1 mr-2 h-6 w-6" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiSave className="-ml-1 mr-2 h-6 w-6" />
              {isEditing ? 'Update Test' : 'Save Test'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiPrinter className="-ml-1 mr-2 h-6 w-6" />
              Print
            </button>
          </div>
        </form>
      </div>

      {/* Test Results Table */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <FiList className="w-9 h-9 sm:w-11 sm:h-11 text-amber-600" />
            <h3 className="text-2xl sm:text-3xl font-bold text-amber-900">
              Skin Test List
            </h3>
          </div>
          <div className="relative w-64 sm:w-80">
            <input
              type="text"
              placeholder="Search tests..."
              onChange={handleSearchChange}
              className="w-64 sm:w-80 pl-10 pr-4 py-2 sm:py-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-hidden rounded-lg border border-amber-100">
            <div className="overflow-x-auto">
              <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                        Actions
                      </th>
                      {filteredSkinTests.length > 0
                        ? Object.keys(filteredSkinTests[0])
                            .filter(
                              (key) => key !== 'code' && key !== 'phoneNumber'
                            )
                            .map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider"
                              >
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))
                        : Object.keys(initialFormData)
                            .filter(
                              (key) => key !== 'code' && key !== 'phoneNumber'
                            )
                            .map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider"
                              >
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">
                        Phone Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {filteredSkinTests.map((test) => (
                      <TableRow
                        key={test.tokenNo}
                        test={test}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkinTesting;
