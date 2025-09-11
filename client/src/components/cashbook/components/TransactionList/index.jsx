import React, { Suspense } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { lazyLoad } from '../../../common/LazyLoad';

// Lazy load components
const TransactionTable = lazyLoad(() => import('../TransactionTable'));
const AnalyticsPanel = lazyLoad(() => import('../AnalyticsPanel'));
const CashAdjustment = lazyLoad(() => import('../../CashAdjustment'));
const BalanceSummary = lazyLoad(() => import('../BalanceSummary'));

const TransactionList = ({
  transactions,
  cashInfo,
  categorySummary,
  monthlySummary,
  activeTab,
  setActiveTab,
  showAdjustment,
  setShowAdjustment,
  onAdjustmentSave,
  loading,
  rowGetter
}) => {
  return (
    <div className="py-1 md:py-2 px-0 sm:px-1 flex flex-col lg:flex-row gap-2 sm:gap-3">
      {/* Main Transactions Panel */}
      <div className="flex-1 order-2 lg:order-1 min-w-0">
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-3 sm:px-4 py-1.5 border-b">
            <h3 className="font-medium text-sm sm:text-base text-amber-800">
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Suspense fallback={<div className="p-4 text-center text-amber-600">Loading transactions...</div>}>
              <TransactionTable
                filteredTransactions={transactions}
                cashInfo={cashInfo}
                rowGetter={rowGetter}
                totals={cashInfo}
              />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="w-full lg:w-72 space-y-3 order-1 lg:order-2">
        <button 
          onClick={() => setShowAdjustment(true)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-colors"
        >
          <ArrowUpDown size={14} className="flex-shrink-0" />
          <span>Cash Adjustments</span>
        </button>
        
        <Suspense fallback={<div className="p-4 text-center text-amber-600">Loading balance...</div>}>
          <BalanceSummary cashInfo={cashInfo} />
        </Suspense>
      
        <div className="sticky top-4">
          <Suspense fallback={<div className="p-4 text-center text-amber-600">Loading analytics...</div>}>
            <AnalyticsPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              categorySummary={categorySummary}
              monthlySummary={monthlySummary}
            />
          </Suspense>
        </div>
      </div>

      {/* Cash Adjustment Modal */}
      <Suspense fallback={null}>
        <CashAdjustment 
          isOpen={showAdjustment}
          onClose={() => setShowAdjustment(false)}
          onSave={onAdjustmentSave}
          isLoading={loading}
        />
      </Suspense>
    </div>
  );
};

export default TransactionList;
