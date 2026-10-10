import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
  </div>
);
