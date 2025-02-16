import React, { useState } from 'react';
import { FiLoader, FiTrash2, FiAlertTriangle, FiX, FiEdit2 } from 'react-icons/fi';
import EditExchangeModal from './EditExchangeModal';

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
              Are you sure you want to delete this exchange record
              {tokenNo ? ` #${tokenNo}` : ''}?
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
              className={`px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 flex items-center space-x-2 ${isDeleting ? 'opacity-80 cursor-not-allowed' : ''}`}
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

const ExchangeTable = ({ exchanges, loading, onDelete, onUpdate }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const columns = [
    {
      title: 'Token No',
      key: 'tokenno',
      width: '100px',
      render: (value) => value
    },
    {
      title: 'Date',
      key: 'date',
      width: '100px',
      render: (value) => formatValue(value, 'date')
    },
    {
      title: 'Time',
      key: 'time',
      width: '100px',
      render: (value) => value
    },
    {
      title: 'Weight',
      key: 'weight',
      width: '100px',
      render: (value) => formatWeight(value)
    },
    {
      title: 'Highest',
      key: 'highest',
      width: '100px',
      render: (value) => formatOther(value)
    },
    {
      title: 'H.Weight',
      key: 'hweight',
      width: '100px',
      render: (value) => formatWeight(value)
    },
    {
      title: 'Average',
      key: 'average',
      width: '100px',
      render: (value) => formatOther(value)
    },
    {
      title: 'A.Weight',
      key: 'aweight',
      width: '100px',
      render: (value) => formatWeight(value)
    },
    {
      title: 'Gold Fineness',
      key: 'goldfineness',
      width: '120px',
      render: (value) => formatOther(value)
    },
    {
      title: 'G.Weight',
      key: 'gweight',
      width: '100px',
      render: (value) => formatWeight(value)
    },
    {
      title: 'Ex.Gold',
      key: 'exgold',
      width: '100px',
      render: (value) => formatOther(value)
    },
    {
      title: 'Ex.Weight',
      key: 'exweight',
      width: '100px',
      render: (value) => formatWeight(value)
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <FiLoader className="h-6 w-6 text-[#D3B04D] animate-spin" />
      </div>
    );
  }

  if (!exchanges || exchanges.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No exchanges found
      </div>
    );
  }

  const handleDelete = async (exchange) => {
    setSelectedExchange(exchange);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    onDelete(selectedExchange.tokenno);
    setShowConfirmDelete(false);
  };

  const handleEdit = (exchange) => {
    setSelectedExchange(exchange);
    setShowEditModal(true);
  };

  const handleUpdate = async (updatedExchange) => {
    await onUpdate(updatedExchange);
    setShowEditModal(false);
    setSelectedExchange(null);
  };

  const formatWeight = (value) => {
    // Ensure weight values always have exactly 3 decimal places
    const numValue = parseFloat(value || 0);
    return numValue.toFixed(3);
  };

  const formatOther = (value) => {
    // Format other numeric values with 2 decimal places
    const numValue = parseFloat(value || 0);
    return numValue.toFixed(2);
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-';
    
    // Format dates
    if (key === 'date' && typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date)) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
      return value;
    }
    
    // Format numbers
    if (typeof value === 'number' || typeof value === 'string') {
      // Check if the field is a weight field
      if (key === 'weight' || 
          key === 'hweight' || 
          key === 'aweight' || 
          key === 'gweight' || 
          key === 'exweight') {
        return formatWeight(value);
      } else {
        return formatOther(value);
      }
    }
    
    return value;
  };

  const filterColumns = (obj) => {
    const excludedColumns = ['id', 'created_at', 'updated_at'];
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !excludedColumns.includes(key))
    );
  };

  return (
    <>
      <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D] text-white">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-5 py-3.5 text-center font-semibold text-sm whitespace-nowrap"
                      style={{ width: column.width }}
                    >
                      {column.title}
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-center font-semibold text-sm whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[...exchanges].reverse().map((exchange) => {
                  const filteredExchange = filterColumns(exchange);
                  return (
                    <tr
                      key={exchange.id}
                      className="border-b border-amber-100 hover:bg-amber-50/70 transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-5 py-2.5 text-center whitespace-nowrap"
                        >
                          {column.render(filteredExchange[column.key])}
                        </td>
                      ))}
                      <td className="px-5 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(exchange)}
                            className="text-amber-600 hover:text-amber-800 transition-colors"
                          >
                            <FiEdit2 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exchange)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <FiTrash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showConfirmDelete && (
        <ConfirmDialog
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
          tokenNo={selectedExchange.tokenno}
        />
      )}

      {showEditModal && (
        <EditExchangeModal
          exchange={selectedExchange}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExchange(null);
          }}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
};

export default ExchangeTable;
