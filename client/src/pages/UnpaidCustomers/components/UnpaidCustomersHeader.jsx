import React from 'react';
import { FiDownload } from 'react-icons/fi';
import { Users } from 'lucide-react';

export const UnpaidCustomersHeader = ({ onExport, isExporting }) => (
  <div className="relative overflow-hidden">
    {/* Background decoration */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D3B04D]/10 to-[#DD845A]/10 rounded-full -mr-16 -mt-16"></div>
    
    <div className="relative flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-2 border-gradient-to-r from-[#D3B04D] to-[#DD845A]">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="bg-gradient-to-br from-[#391145] to-[#D3B04D] p-3 rounded-xl shadow-lg">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
            Unpaid Customers
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track outstanding payments</p>
        </div>
      </div>
      
      {onExport && (
        <button
          onClick={onExport}
          disabled={isExporting}
          className="group flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 hover:scale-105 transform"
        >
          <FiDownload className={`h-4.5 w-4.5 transition-transform duration-300 ${isExporting ? 'animate-bounce' : 'group-hover:translate-y-0.5'}`} />
          <span className="font-medium">
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </span>
        </button>
      )}
    </div>
  </div>
);

export default UnpaidCustomersHeader;
