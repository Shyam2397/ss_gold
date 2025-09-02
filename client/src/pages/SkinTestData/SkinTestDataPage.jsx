import React from 'react';
import { GiTestTubes } from 'react-icons/gi';
import { FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';

import useSkinTests from './hooks/useSkinTests';
import DateInput from './components/DateInput';
import SkinTestTable from './components/SkinTestTable';
import ExportButton from './components/ExportButton';

const SkinTestDataPage = () => {
  const {
    filteredTests,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    refetch
  } = useSkinTests();

  return (
    <div
      className="p-6 sm:p-8 bg-white shadow-lg rounded-xl max-w-full h-full text-[#391145] m-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 pb-3 border-b-2 border-[#D3B04D] border-solid">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <GiTestTubes className="h-6 w-6 text-amber-500" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
            Skin Test Data
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full hover:bg-amber-100 transition-colors duration-150"
            title="Refresh data"
            disabled={loading}
          >
            <FiRefreshCw className={`h-5 w-5 text-amber-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <ExportButton data={filteredTests} />
        </div>
      </div>

      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r flex items-center space-x-2 text-sm"
        >
          <FiAlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-5 bg-[#F9F3F1] px-5 py-2.5 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <DateInput
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <div className="pl-10">
            <DateInput
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            onClick={clearDates}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors duration-150 bg-amber-50 hover:bg-amber-100 rounded-xl w-[150px] ml-16 border-amber-500"
          >
            <FiX className="h-4.5 w-4.5" />
            Clear Dates
          </button>
        </div>
      </div>

      <SkinTestTable tests={filteredTests} loading={loading} />
    </div>
  );
};

export default SkinTestDataPage;
