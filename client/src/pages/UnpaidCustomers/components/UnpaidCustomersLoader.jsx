import React from 'react';
import { Loader2 } from 'lucide-react';

const UnpaidCustomersLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <div className="relative">
      <div className="h-16 w-16 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] rounded-full animate-pulse"></div>
      <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-white animate-spin" />
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-gray-700 mb-1">Loading unpaid customers...</p>
      <p className="text-sm text-gray-500">Please wait while we fetch the data</p>
    </div>
    
    {/* Skeleton cards */}
    <div className="w-full max-w-4xl mt-8 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default UnpaidCustomersLoader;
