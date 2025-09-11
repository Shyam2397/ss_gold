import React from 'react';
import { RefreshCw } from 'lucide-react';

const CashBookHeader = ({ isRefreshing, onRefresh }) => {
  return (
    <div className="px-3 sm:px-4 py-2 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 bg-white shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-amber-800 tracking-tight">Cash Book</h1>
        <span className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-50 text-amber-700 rounded-full font-medium ring-1 ring-amber-100/50">
          Report
        </span>
      </div>
      {isRefreshing && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-xs sm:text-sm text-amber-600"
        >
          <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Updating...</span>
        </button>
      )}
    </div>
  );
};

export default CashBookHeader;
