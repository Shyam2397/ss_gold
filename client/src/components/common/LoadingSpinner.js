import React from 'react';

const LoadingSpinner = ({ size = 'default' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    default: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className={`animate-spin rounded-full border-4 border-amber-200 border-t-amber-500 ${sizeClasses[size]}`} />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
