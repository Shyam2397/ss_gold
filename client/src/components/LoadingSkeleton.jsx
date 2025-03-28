import React from 'react';

export const ActivitySkeleton = () => (
  <div className="animate-pulse flex items-start space-x-4 p-3">
    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
    </div>
  </div>
);

export const CustomerSkeleton = () => (
  <div className="animate-pulse flex items-start space-x-4 p-3">
    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    <div className="flex-1">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-1/2 mt-2"></div>
    </div>
  </div>
);
