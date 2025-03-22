import React, { useCallback } from 'react';
import { ArrowUpDown, FileSpreadsheet, Printer, Mail, X } from 'lucide-react';
import { motion } from 'framer-motion';
import CashAdjustment from './CashAdjustment';
import TransactionTable from './components/TransactionTable';
import BalanceSummary from './components/BalanceSummary';
import Analytics from './components/Analytics';
import { useCashBook } from './hooks/useCashBook';

function CashBook({ isOpen, onClose }) {
  const {
    transactions,
    loading,
    error,
    filteredTransactions,
    cashInfo,
    activeTab,
    showAdjustment,
    isInitialLoading,
    isRefreshing,
    categorySummary,
    monthlySummary,
    setActiveTab,
    setShowAdjustment,
    handleAdjustmentSave,
    handleExport,
    fetchTransactions,
    rowGetter,
    getRowStyle
  } = useCashBook();

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-[95vw] md:w-[92vw] max-w-7xl max-h-[95vh] md:max-h-[92vh] overflow-hidden flex flex-col transition-transform duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 md:px-7 py-2 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Cash Book</h1>
            <span className="text-sm px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium ring-1 ring-amber-100/50">Report</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          {isRefreshing && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <p className="text-sm text-amber-600">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
              <div className="text-red-500 text-center">
                <p className="text-lg font-medium">Error loading transactions</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={() => fetchTransactions()}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
              <div className="text-gray-500 text-center">
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm mt-1">There are no transactions recorded for this period.</p>
              </div>
            </div>
          ) : (
            <div className="py-2 md:py-4 px-4 flex flex-col lg:flex-row gap-3 md:gap-4">
              <div className="flex-1 order-2 lg:order-1">
                <div className="border rounded-xl">
                  <div className="bg-amber-50 px-4 py-2 border-b">
                    <h3 className="font-medium text-amber-800">
                      {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Transactions
                    </h3>
                  </div>
                  <TransactionTable 
                    filteredTransactions={filteredTransactions}
                    cashInfo={cashInfo}
                    rowGetter={rowGetter}
                    getRowStyle={getRowStyle}
                  />
                </div>
              </div>

              <div className="w-full lg:w-64 space-y-3 order-1 lg:order-2">
                <button 
                  onClick={() => setShowAdjustment(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowUpDown size={16} />
                  Cash Adjustments
                </button>

                <BalanceSummary cashInfo={cashInfo} />
                <Analytics 
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  categorySummary={categorySummary}
                  monthlySummary={monthlySummary}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-3 md:px-4 py-2 md:py-3 flex justify-between items-center bg-white sticky bottom-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => handleExport('excel')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors">
              <FileSpreadsheet size={16} />
              Excel
            </button>
            <button onClick={() => handleExport('print')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors">
              <Printer size={16} />
              Print
            </button>
            <button onClick={() => handleExport('email')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors">
              <Mail size={16} />
              Email
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-full">Limited Version</span>
          </div>
        </div>
      </motion.div>
      <CashAdjustment 
        isOpen={showAdjustment}
        onClose={() => setShowAdjustment(false)}
        onSave={handleAdjustmentSave}
      />
    </motion.div>
  );
}

export default React.memo(CashBook);