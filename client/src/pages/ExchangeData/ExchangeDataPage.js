import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

import useExchanges from './hooks/useExchanges';
import DateInput from './components/DateInput';
import ExchangeTable from './components/ExchangeTable';
import ExportButton from './components/ExportButton';

const ExchangeDataPage = () => {
  const {
    filteredExchanges,
    loading,
    error,
    successMessage,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    deleteExchange,
    updateExchange
  } = useExchanges();

  return (
    <div
      className="flex flex-col h-full overflow-hidden p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-xl rounded-2xl text-[#391145]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-4 border-[#D3B04D]">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
          Exchange Data
        </h1>
        {error && (
        <div
          className=" p-1 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-center space-x-2"
        >
          <FiAlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className=" p-1 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-r flex items-center space-x-2"
        >
          <FiAlertCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}
        <ExportButton data={filteredExchanges} />
      </div>

      <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <DateInput
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e)}
          />
          <div className="pl-10">
            <DateInput
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e)}
            />
          </div>
          <div className="flex items-center space-x-4 pl-10">
            <button
              onClick={clearDates}
              className="px-4 py-2 text-sm text-amber-600 hover:text-amber-800 transition-colors"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-hidden">
        <ExchangeTable
          exchanges={filteredExchanges}
          loading={loading}
          onDelete={deleteExchange}
          onUpdate={updateExchange}
        />
      </div>
    </div>
  );
};

export default ExchangeDataPage;
