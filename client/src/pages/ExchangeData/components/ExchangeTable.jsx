import React, { useState } from 'react';
import { FiLoader, FiTrash2, FiAlertTriangle, FiX, FiEdit2 } from 'react-icons/fi';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import EditExchangeModal from './EditExchangeModal';

// Utility functions for formatting
const formatValue = (value, type) => {
  if (!value) return '';
  if (type === 'date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return value;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr;
};

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

  // Update the sorting logic to properly handle dates
  const sortedExchanges = [...exchanges].sort((a, b) => {
    // Parse dates using the same format as they appear in the table (DD-MM-YYYY)
    const [dayA, monthA, yearA] = (a.date || '').split('-');
    const [dayB, monthB, yearB] = (b.date || '').split('-');
    
    // Create Date objects (subtract 1 from month as JS months are 0-based)
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    
    // Compare dates first
    if (dateA - dateB !== 0) {
      return dateB - dateA; // For descending order
    }
    
    // If dates are equal, compare times
    if (a.time && b.time) {
      return b.time.localeCompare(a.time);
    }
    
    return 0;
  });

  const columns = [
    {
      title: 'Token No',
      key: 'token_no',
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
      render: (value) => formatTime(value)
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

  const getColumnWidth = (key) => {
    switch (key.toLowerCase()) {
      case 'tokenno':
        return 80;
      case 'date':
      case 'time':
        return 80;
      case 'weight':
      case 'hweight':
      case 'aweight':
      case 'gweight':
      case 'exweight':
        return 100;
      case 'highest':
      case 'average':
      case 'exgold':
        return 100;
      case 'goldfineness':
        return 100;
      default:
        return 100;
    }
  };

  const getTotalTableWidth = (columns) => {
    let totalWidth = 50;
    columns.forEach(key => {
      totalWidth += getColumnWidth(key) + 10;
    });
    return totalWidth + 100; // Extra 100 for actions column
  };

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
    onDelete(selectedExchange.token_no);
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

  // Update the cell renderer to properly handle token numbers
  const cellRenderer = ({ cellData, rowData, dataKey }) => {
    if (dataKey === 'actions') {
      return (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleEdit(rowData)}
            className="text-amber-600 hover:text-amber-800 transition-colors"
          >
            <FiEdit2 className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => handleDelete(rowData)}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <FiTrash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      );
    }

    // Special handling for token number
    if (dataKey === 'token_no') {
      return (
        <div className="truncate whitespace-nowrap text-center">
          {rowData.token_no || '-'}
        </div>
      );
    }

    // Special handling for time column
    if (dataKey === 'time') {
      return (
        <div className="truncate whitespace-nowrap text-center">
          {cellData || '-'}
        </div>
      );
    }

    return (
      <div 
        className="truncate whitespace-nowrap text-center"
        title={cellData}
      >
        {formatValue(cellData, dataKey)}
      </div>
    );
  };

  const headerRenderer = ({ label }) => (
    <div className="text-center font-semibold text-sm whitespace-nowrap">
      {label}
    </div>
  );

  return (
    <>
      <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden h-[500px]">
        <AutoSizer>
          {({ width, height }) => (
            <div style={{ height, width, overflowX: 'auto', overflowY: 'hidden' }}>
              <Table
                width={Math.max(width, getTotalTableWidth(columns.map(c => c.key)))}
                height={height}
                headerHeight={40}
                rowHeight={40}
                rowCount={sortedExchanges.length}
                rowGetter={({ index }) => filterColumns(sortedExchanges[index])}
                rowClassName={({ index }) => 
                  `${index === -1 
                    ? 'bg-amber-500 rounded-t-xl text-white' 
                    : index % 2 === 0 
                      ? 'bg-white hover:bg-amber-100/40' 
                      : 'bg-amber-50/40 hover:bg-amber-100/40'} 
                  transition-colors duration-150 text-sm text-amber-900`
                }
              >
                {columns.map(column => (
                  <Column
                    key={column.key}
                    label={column.title}
                    dataKey={column.key}
                    width={getColumnWidth(column.key)}
                    flexGrow={0}
                    flexShrink={0}
                    cellRenderer={cellRenderer}
                    headerClassName="text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center"
                  />
                ))}
                <Column
                  label="Actions"
                  dataKey="actions"
                  width={100}
                  flexGrow={0}
                  flexShrink={0}
                  cellRenderer={cellRenderer}
                  headerClassName="text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center"
                />
              </Table>
            </div>
          )}
        </AutoSizer>
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
