import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-[150px] sm:min-h-[200px]">
      <div className="relative">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-t-3 sm:border-t-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-t-3 sm:border-t-4 border-yellow-500 border-t-transparent rounded-full animate-spin-reverse"></div>
        </div>
        <p className="text-center text-sm sm:text-base text-amber-800 mt-3">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
