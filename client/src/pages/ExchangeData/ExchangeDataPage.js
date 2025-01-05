import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiX } from 'react-icons/fi';

import useExchanges from './hooks/useExchanges';
import DateInput from './components/DateInput';
import ExchangeTable from './components/ExchangeTable';
import ExportButton from './components/ExportButton';

const ExchangeDataPage = () => {
  const {
    filteredExchanges,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    deleteExchange
  } = useExchanges();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full overflow-hidden p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-xl rounded-2xl text-[#391145]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-4 border-[#D3B04D]">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
          Exchange Data
        </h1>
        <ExportButton data={filteredExchanges} />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-center space-x-2"
        >
          <FiAlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </motion.div>
      )}

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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearDates}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors duration-200"
          >
            <FiX className="h-5 w-5" />
            Clear Dates
          </motion.button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ExchangeTable 
          exchanges={filteredExchanges} 
          loading={loading} 
          onDelete={deleteExchange} 
        />
      </div>
    </motion.div>
  );
};

export default ExchangeDataPage;
