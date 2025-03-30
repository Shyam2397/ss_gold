import React, { useMemo, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';

const formatDateToIST = (dateString) => {
  if (!dateString) return '';
  try {
    // Handle different date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing DD-MM-YYYY format
      const [day, month, year] = dateString.split('-');
      if (day && month && year) {
        return `${day}-${month}-${year}`;
      }
      return dateString;
    }
    
    // Format to DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Date parsing error:', error);
    return dateString;
  }
};

const formatTimeToIST = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const TokenTable = ({ tokens = [], onEdit, onDelete, onPaymentStatusChange }) => {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tokens found
      </div>
    );
  }

  const columns = [
    { label: "Actions", key: "actions", width: 130, flexGrow: 0 },
    { label: "Token No", key: "tokenNo", width: 100, flexGrow: 0 },
    { label: "Date", key: "date", width: 100, flexGrow: 0 },
    { label: "Time", key: "time", width: 100, flexGrow: 0 },
    { label: "Code", key: "code", width: 80, flexGrow: 0 },
    { label: "Name", key: "name", width: 200, flexGrow: 1 },
    { label: "Test", key: "test", width: 150, flexGrow: 1 },
    { label: "Weight", key: "weight", width: 100, flexGrow: 0 },
    { label: "Sample", key: "sample", width: 150, flexGrow: 1 },
    { label: "Amount", key: "amount", width: 100, flexGrow: 0 }
  ];

  // Calculate minimum width needed
  const minTableWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  // Memoize formatters
  const formatters = useMemo(() => ({
    date: formatDateToIST,
    time: formatTimeToIST,
    weight: (val) => parseFloat(val || 0).toFixed(3),
    amount: (val) => typeof val === 'number' ? val.toFixed(2) : val
  }), []);

  // Memoize cell renderer
  const cellRendererMemo = useCallback(({ rowData, dataKey, columnIndex }) => {
    if (dataKey === 'actions') {
      return (
        <div className="flex items-center justify-center space-x-2">
          <input
            type="checkbox"
            checked={Boolean(rowData.isPaid)}
            onChange={(e) => onPaymentStatusChange(rowData.id, e.target.checked)}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
          />
          <span className={`flex items-center ${rowData.isPaid ? 'text-green-600' : 'text-red-600'}`}>
            {rowData.isPaid ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
          </span>
          <button
            onClick={() => onEdit(rowData)}
            className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(rowData.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    let value = rowData[dataKey];
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return <div className="text-center text-xs text-gray-400">-</div>;
    }

    // Format specific columns
    if (formatters[dataKey]) {
      value = formatters[dataKey](value);
    }

    return (
      <div className="text-center text-xs text-amber-900 truncate py-4">
        {value}
      </div>
    );
  }, [onEdit, onDelete, onPaymentStatusChange, formatters]);

  const headerRenderer = ({ label }) => (
    <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
      {label}
    </div>
  );

  return (
    <div className="rounded border border-amber-100" style={{ height: '450px' }}>
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <AutoSizer>
          {({ height, width }) => (
            <div style={{ height, width, overflowX: 'auto', overflowY: 'hidden' }}>
              <Table
                width={Math.max(width, minTableWidth)}
                height={height}
                headerHeight={40}
                rowHeight={50}
                rowCount={tokens.length}
                rowGetter={({ index }) => tokens[index]}
                rowClassName={({ index }) => 
                  `${index === -1 ? 'bg-amber-500' : index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'} 
                   ${index !== -1 ? 'hover:bg-amber-50/40' : ''} transition-colors`
                }
                overscanRowCount={5}
              >
                {columns.map(({ label, key, width, flexGrow }) => (
                  <Column
                    key={key}
                    label={label}
                    dataKey={key}
                    width={width}
                    flexGrow={flexGrow}
                    cellRenderer={cellRendererMemo}
                    headerRenderer={headerRenderer}
                    className="divide-x divide-amber-100"
                    style={{ overflow: 'hidden' }}
                  />
                ))}
              </Table>
            </div>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default TokenTable;
