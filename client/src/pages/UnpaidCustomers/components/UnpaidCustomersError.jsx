import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const UnpaidCustomersError = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-xl shadow-sm" role="alert">
      <div className="flex items-start space-x-4">
        <div className="bg-red-400 p-2 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">Unable to Load Data</h3>
          <p className="text-red-700 text-sm leading-relaxed mb-4">
            {error.message || 'Failed to load unpaid customers data. Please check your connection and try again.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnpaidCustomersError;
