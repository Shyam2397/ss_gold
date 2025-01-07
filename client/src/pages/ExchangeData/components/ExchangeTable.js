import React from 'react';
import { FiLoader, FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, tokenNo, isDeleting }) => {
  // Handle escape key for closing dialog
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isDeleting, isOpen]);

  // Handle click outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slideIn">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete token number <span className="font-semibold text-gray-900">#{tokenNo}</span>?
            </p>
            <p className="text-sm text-red-500">
              This action cannot be undone. The exchange record will be permanently deleted.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className={`
                px-4 py-2 rounded-md border border-gray-300
                text-gray-700 bg-white
                hover:bg-gray-50 hover:text-gray-900
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
                transition-colors duration-200
                ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`
                px-4 py-2 rounded-md
                text-white bg-red-500
                hover:bg-red-600
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                transition-colors duration-200
                flex items-center space-x-2
                ${isDeleting ? 'opacity-80 cursor-not-allowed' : ''}
              `}
            >
              {isDeleting ? (
                <>
                  <FiLoader className="animate-spin h-4 w-4" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="h-4 w-4" />
                  <span>Delete Exchange</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteButton = ({ onDelete, tokenNo }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      const success = await onDelete(tokenNo);
      if (!success) {
        throw new Error('Failed to delete exchange');
      }
      setShowConfirm(false);
    } catch (err) {
      setError(err.message || 'Failed to delete. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className={`text-red-500 hover:text-red-700 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={error || "Delete Exchange"}
      >
        <FiTrash2 className="h-5 w-5" />
      </button>
      {showError && error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-red-100 text-red-700 p-2 rounded text-xs text-center shadow-lg">
          <div className="font-semibold">Error</div>
          {error}
        </div>
      )}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        tokenNo={tokenNo}
        isDeleting={isDeleting}
      />
    </div>
  );
};

const getColumnAlignment = (key) => {
  const numericColumns = ['amount', 'rate', 'quantity', 'token_no'];
  const dateColumns = ['date', 'created_at', 'updated_at'];
  
  if (numericColumns.some(col => key.toLowerCase().includes(col))) return 'text-right';
  if (dateColumns.some(col => key.toLowerCase().includes(col))) return 'text-center';
  return 'text-left';
};

const getTokenNumber = (exchange) => {
  const tokenValue = exchange.tokenNo || exchange.token_no || '';
  // Remove any non-digit characters and parse as integer
  const tokenNumber = parseInt(tokenValue.toString().replace(/\D/g, ''));
  return isNaN(tokenNumber) ? 0 : tokenNumber;
};

const formatValue = (value, key) => {
  if (value === null || value === undefined) return '-';
  
  if (key === 'date' && typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date)) {
      return date.toLocaleDateString('en-GB');
    }
  }
  
  if (typeof value === 'number') {
    if (key.includes('amount') || key.includes('rate')) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  
  return value;
};

const filterColumns = (obj) => {
  const excludedColumns = ['_id', '__v'];
  return Object.keys(obj).filter(key => !excludedColumns.includes(key));
};

const ExchangeTable = ({ exchanges, loading, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 text-[#D3B04D] animate-spin" />
      </div>
    );
  }

  if (!exchanges || exchanges.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No exchange data available
      </div>
    );
  }

  // Sort exchanges by token number in descending order
  const sortedExchanges = [...exchanges].sort((a, b) => {
    const tokenA = getTokenNumber(a);
    const tokenB = getTokenNumber(b);

    if (tokenA === tokenB) return 0;
    return tokenA > tokenB ? -1 : 1;
  });

  const columns = filterColumns(exchanges[0]);

  return (
    <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <table className="min-w-full divide-y divide-amber-100">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D]">
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white first:rounded-tl-lg">
                        Actions
                      </th>
                      {columns.map((column) => (
                        <th
                          key={column}
                          className={`px-6 py-4 text-sm font-semibold text-white last:rounded-tr-lg whitespace-nowrap ${getColumnAlignment(column)}`}
                        >
                          {column.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {sortedExchanges.map((exchange, index) => (
                      <tr
                        key={exchange.token_no || index}
                        className="hover:bg-amber-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <DeleteButton 
                              onDelete={onDelete} 
                              tokenNo={exchange.tokenNo || exchange.token_no} 
                            />
                          </div>
                        </td>
                        {columns.map((column) => (
                          <td
                            key={column}
                            className={`px-6 py-3 text-sm whitespace-nowrap ${getColumnAlignment(column)} text-gray-700`}
                          >
                            {formatValue(exchange[column], column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeTable;
