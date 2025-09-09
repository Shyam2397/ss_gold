import React, { useMemo, useCallback, memo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FixedSizeList as List } from 'react-window';

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Date parsing error:', error);
    return dateString;
  }
};

// Table dimensions
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;

const ExpensesTable = ({ expenses = [], onEdit, onDelete }) => {
  // Calculate equal width for each column
  const columnCount = 6; // Number of columns
  const columnWidth = 180; // Equal width for each column (reduced to fit more columns)

  const columns = useMemo(() => [
    {
      label: 'Date',
      key: 'date',
      width: columnWidth,
      render: (row) => formatDate(row.date)
    },
    {
      label: 'Expense Type',
      key: 'expenseType',
      width: columnWidth,
      render: (row) => {
        // Handle different possible structures of expense type data
        if (typeof row.expenseType === 'object' && row.expenseType !== null) {
          return row.expenseType.expense_name || 'N/A';
        } else if (row.expenseType) {
          return row.expenseType; // In case it's already a string
        } else if (row.expense_type) {
          return row.expense_type; // Alternative field name
        } else if (row.expenseTypeId) {
          // If we have an ID but no populated object, we might need to fetch the name
          return 'Loading...';
        }
        return 'N/A';
      }
    },
    {
      label: 'Paid To',
      key: 'paidTo',
      width: columnWidth,
      render: (row) => row.paidTo || row.paid_to || '-'
    },
    {
      label: 'Amount',
      key: 'amount',
      width: columnWidth,
      render: (row) => `₹${parseFloat(row.amount || 0).toFixed(2)}`,
      className: 'font-medium'
    },
    {
      label: 'Payment Mode',
      key: 'payMode',
      width: columnWidth,
      render: (row) => {
        const mode = row.payMode || row.pay_mode || row.paymentMode || row.payment_mode;
        if (!mode) return '-';
        // Format the payment mode (e.g., 'CASH' -> 'Cash')
        return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
      }
    },
    {
      label: 'Remarks',
      key: 'remarks',
      width: columnWidth * 1.5, // Make remarks column slightly wider
      render: (row) => row.remarks || '-',
      className: 'whitespace-normal break-words' // Ensure long text wraps
    },
    {
      label: 'Actions',
      key: 'actions',
      width: columnWidth,
      render: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
            title="Edit"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row._id);
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ], [onEdit, onDelete]);

  // Calculate total width of all columns with some extra space for borders
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0) + (columns.length - 1) * 1 // Add 1px for each border
  , [columns]);

  // Track horizontal scroll position
  const [scrollLeft, setScrollLeft] = React.useState(0);

  // Handle scroll event
  const handleScroll = (e) => {
    setScrollLeft(e.target.scrollLeft);
  };

  // Render table header
  const renderHeader = () => (
    <div 
      className="flex bg-amber-500 text-white rounded-t-lg relative z-10"
      style={{
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <div 
        className="flex"
        style={{
          minWidth: totalWidth,
          transform: `translateX(-${scrollLeft}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {columns.map((column, index) => (
          <div 
            key={column.key}
            className="flex-shrink-0 flex items-center justify-center text-xs font-medium uppercase tracking-wider py-2"
            style={{
              width: column.width,
              borderRight: index < columns.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            {column.label}
          </div>
        ))}
      </div>
    </div>
  );

  // Render a single row
  const Row = useCallback(({ index, style }) => {
    const row = expenses[index];
    const isEven = index % 2 === 0;
    
    return (
      <div 
        className={`flex items-center ${isEven ? 'bg-white' : 'bg-amber-50/40'} hover:bg-amber-50/40 transition-colors`}
        style={{
          ...style,
          width: '100%',
          minWidth: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {columns.map((column, colIndex) => (
          <div
            key={`${index}-${column.key}`}
            className={`flex-shrink-0 flex items-center justify-center text-xs text-amber-900 py-2 ${column.className || ''}`}
            style={{
              width: column.width,
              borderRight: colIndex < columns.length - 1 ? '1px solid #FEF3C7' : 'none',
              height: ROW_HEIGHT - 1 // Subtract 1px for border
            }}
          >
            {column.render ? column.render(row) : row[column.key] || '-'}
          </div>
        ))}
      </div>
    );
  }, [expenses, columns]);

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No expenses found. Add your first expense to see it here.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-100 border-solid overflow-hidden flex flex-col" style={{ height: '350px' }}>
      {renderHeader()}
      <div 
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#F59E0B transparent'
        }}
      >
        <div style={{ width: totalWidth }}>
          <List
            height={350 - HEADER_HEIGHT - 2} // Subtract 2px for borders
            itemCount={expenses.length}
            itemSize={ROW_HEIGHT}
            width={totalWidth}
            style={{ overflow: 'visible' }}
            overscanCount={5}
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
};

export default memo(ExpensesTable, (prevProps, nextProps) => {
  // Only re-render if expenses array changes
  return prevProps.expenses === nextProps.expenses;
});
