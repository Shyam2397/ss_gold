import React from 'react';
import { FiAlertCircle,FiRefreshCw } from 'react-icons/fi';

import useTokens from './hooks/useTokensQuery';
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
      className="p-6 sm:p-8 bg-white shadow-lg rounded-xl max-w-full h-full text-[#391145] m-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 pb-3 border-b-2 border-[#D3B04D]">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
          Token Data
        </h1>
        <ExportButton data={filteredTokens} />
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
            className="flex items-center justify-center gap-2 px-4 py-2 ml-16 text-red-600 w-[150px] bg-amber-50 hover:bg-amber-100 rounded-xl hover:text-red-700 transition-colors duration-150 border-amber-500"
          >
            <FiRefreshCw className="h-4.5 w-4.5" />
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
