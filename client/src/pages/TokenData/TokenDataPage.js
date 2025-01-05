import React from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

import useTokens from './hooks/useTokens';
import DateInput from './components/DateInput';
import TokenTable from './components/TokenTable';
import ExportButton from './components/ExportButton';

const TokenDataPage = () => {
  const {
    filteredTokens,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    deleteToken
  } = useTokens();

  return (
    <div
      className="p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-xl rounded-2xl max-w-full h-full text-[#391145]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-4 border-[#D3B04D]">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
          Token Data
        </h1>
        <ExportButton data={filteredTokens} />
      </div>

      {error && (
        <div
          className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-center space-x-2"
        >
          <FiAlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
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
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors duration-200"
          >
            <FiX className="h-5 w-5" />
            Clear Dates
          </button>
        </div>
      </div>

      <TokenTable 
        tokens={filteredTokens} 
        loading={loading} 
        onDelete={deleteToken} 
      />
    </div>
  );
};

export default TokenDataPage;
