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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="mr-3">
              <GiTestTubes className="w-8 h-8 text-amber-600 mr-3" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900">Skin Testing</h2>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg">
            <FormInput
              label="Token No"
              name="tokenNo"
              value={formData.tokenNo}
              onChange={handleTokenChange}
            />
            <FormInput
              label="Date"
              name="date"
              value={formData.date}
              readOnly
            />
            <FormInput
              label="Time"
              name="time"
              value={formData.time}
              readOnly
            />
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg">
            <FormInput
              label="Name"
              name="name"
              value={formData.name}
              readOnly
            />
            <FormInput
              label="Weight"
              name="weight"
              value={formData.weight}
              readOnly
            />
            <FormInput
              label="Sample"
              name="sample"
              value={formData.sample}
              readOnly
            />
          </div>

          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
                />
              ))}
          </div>

          <div className="flex justify-end space-x-4">
            {sum > 0 && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-md">
                <div className="flex">
                  <div className="ml-3">
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
              className="inline-flex items-center px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
            >
              <FiRotateCcw className="-ml-1 mr-2 h-5 w-5" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiSave className="-ml-1 mr-2 h-5 w-5" />
              {isEditing ? 'Update Test' : 'Save Test'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
              Print
            </button>
          </div>
        </form>
      </div>

      {/* Test Results Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="mr-3">
              <FiList className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-amber-900">
              Skin Test List
            </h3>
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search tests..."
              onChange={handleSearchChange}
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-hidden rounded-lg border border-amber-100">
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
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
                                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
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
                                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                              >
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
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
