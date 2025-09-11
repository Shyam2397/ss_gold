import React, { useCallback } from 'react';
import { FileSpreadsheet, Printer, Mail } from 'lucide-react';

const CashBookFooter = ({ onExport }) => {
  const handleExport = useCallback((type) => {
    if (typeof onExport === 'function') {
      onExport(type);
    }
  }, [onExport]);

  return (
    <div className="border-t px-2 sm:px-3 py-1.5 flex flex-row xs:flex-row justify-between items-center gap-1.5 bg-white sticky bottom-0 shadow-sm mt-auto">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <button 
          onClick={() => handleExport('excel')}
          className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-xs sm:text-sm font-medium transition-colors px-2 py-1 hover:bg-amber-50 rounded-md"
        >
          <FileSpreadsheet size={14} className="flex-shrink-0" />
          <span className="whitespace-nowrap">Excel</span>
        </button>
        <button 
          onClick={() => handleExport('print')}
          className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-xs sm:text-sm font-medium transition-colors px-2 py-1 hover:bg-amber-50 rounded-md"
        >
          <Printer size={14} className="flex-shrink-0" />
          <span className="whitespace-nowrap">Print</span>
        </button>
        <button 
          onClick={() => handleExport('email')}
          className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-xs sm:text-sm font-medium transition-colors px-2 py-1 hover:bg-amber-50 rounded-md"
        >
          <Mail size={14} className="flex-shrink-0" />
          <span className="whitespace-nowrap">Email</span>
        </button>
      </div>
      <div className="flex items-center gap-2 text-[10px] xs:text-xs text-gray-500">
        <span className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded-full whitespace-nowrap">
          Limited Version
        </span>
      </div>
    </div>
  );
};

export default CashBookFooter;
