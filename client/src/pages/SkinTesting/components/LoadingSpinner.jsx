import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-[150px] sm:min-h-[200px]">
      <div className="relative">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-t-3 sm:border-t-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-center text-sm sm:text-base text-amber-800 mt-3">Loading...</p>
      </div>
    </div>
  );
};

export default React.memo(LoadingSpinner);
