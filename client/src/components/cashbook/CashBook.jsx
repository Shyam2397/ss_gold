import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useCashBookData } from './hooks/useCashBookData';
import { lazyLoad } from '../common/LazyLoad';

// Lazy load components
const CashBookHeader = lazyLoad(() => import('./components/CashBookHeader'));
const CashBookFooter = lazyLoad(() => import('./components/CashBookFooter'));
const TransactionList = lazyLoad(() => import('./components/TransactionList'));

const CashBook = () => {
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);
  
  // Use custom hook for data management
  const {
    transactions,
    cashInfo,
    loading,
    error,
    isRefreshing,
    categorySummary,
    monthlySummary,
    fetchTransactions,
    debouncedFetch
  } = useCashBookData();

    // Set up polling for data refresh
    useEffect(() => {
      fetchTransactions();
      const pollInterval = setInterval(() => {
        debouncedFetch(true);
      }, 30000);
      
      return () => {
        clearInterval(pollInterval);
        debouncedFetch.cancel();
      };
    }, [fetchTransactions, debouncedFetch]);
  
    // Handle manual refresh
    const handleRefresh = useCallback(() => {
      debouncedFetch(true);
    }, [debouncedFetch]);
  
    // Handle export functionality
    const handleExport = useCallback((type) => {
      switch(type) {
        case 'excel':
        case 'print':
          window.print();
          break;
        case 'email':
          // Email export logic here
          break;
        default:
          break;
      }
    }, []);
  
    // Handle cash adjustment save
    const handleAdjustmentSave = useCallback(async () => {
      await fetchTransactions(true);
      setShowAdjustment(false);
    }, [fetchTransactions]);
  
    // Row getter for transaction table
    const rowGetter = useCallback(({ index }) => {
      if (!transactions?.length) return null;
      if (index === 0) return { type: 'opening' };
      if (index === transactions.length + 1) return { type: 'closing' };
      return transactions[index - 1];
    }, [transactions]);

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[100vh] bg-white mx-2 sm:mx-4 my-4 p-2 sm:p-3 shadow-md rounded-xl border border-amber-100 border-solid">
        <Suspense fallback={<div className="h-12 bg-amber-50 rounded animate-pulse" />}>
          <CashBookHeader 
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </Suspense>
  
        <div className="flex-1 overflow-auto p-1 sm:p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              <p className="text-sm text-amber-600">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
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
          ) : (
            <Suspense fallback={<div className="p-4 text-center text-amber-600">Loading transaction list...</div>}>
              <TransactionList
                transactions={transactions}
                cashInfo={cashInfo}
                categorySummary={categorySummary}
                monthlySummary={monthlySummary}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showAdjustment={showAdjustment}
                setShowAdjustment={setShowAdjustment}
                onAdjustmentSave={handleAdjustmentSave}
                loading={loading}
                rowGetter={rowGetter}
              />
            </Suspense>
          )}
        </div>
  
        <Suspense fallback={null}>
          <CashBookFooter onExport={handleExport} />
        </Suspense>
      </div>
    );
  };
  
  export default React.memo(CashBook);