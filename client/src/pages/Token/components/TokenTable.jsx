import React, { useMemo, useCallback, memo } from 'react';
import { FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { formatDate } from '../../../utils/dateUtils';

const MAX_CACHE_ENTRIES = 500;

// Bounded so a long-lived session cannot grow these without limit.
const createBoundedCache = () => {
  const cache = new Map();
  return {
    get: (key) => (cache.has(key) ? cache.get(key) : undefined),
    set: (key, value) => {
      if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
      cache.set(key, value);
      return value;
    }
  };
};

// The API returns dates as 'YYYY-MM-DD'. Parsing that with `new Date(str)`
// yields UTC midnight, so the local-time getters below rendered the previous
// day in every timezone behind UTC. formatDate reads it as local midnight.
const createDateFormatter = () => {
  const cache = createBoundedCache();

  return (dateString) => {
    if (!dateString) return '';

    const cached = cache.get(dateString);
    if (cached !== undefined) return cached;

    const result = formatDate(dateString);
    return cache.set(dateString, result);
  };
};

const createTimeFormatter = () => {
  const cache = createBoundedCache();

  return (timeString) => {
    if (!timeString) return '';

    const cached = cache.get(timeString);
    if (cached !== undefined) return cached;

    const [hours, minutes] = String(timeString).split(':');
    const hour = parseInt(hours, 10);
    // An unparseable time would otherwise render the literal "Invalid Date".
    if (Number.isNaN(hour) || Number.isNaN(parseInt(minutes, 10))) return '';

    const date = new Date();
    date.setHours(hour, parseInt(minutes, 10), 0, 0);
    const result = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return cache.set(timeString, result);
  };
};

// Memoize formatters outside component to prevent recreation
const formatters = {
  date: createDateFormatter(),
  time: createTimeFormatter(),
  weight: (val) => {
    const parsed = parseFloat(val || 0);
    return Number.isNaN(parsed) ? '' : parsed.toFixed(3);
  },
  amount: (val) => {
    const parsed = parseFloat(val);
    return Number.isNaN(parsed) ? '' : parsed.toFixed(2);
  }
};

// Memoize ActionsCell component
const ActionsCell = memo(({ rowData, onEdit, onDelete, onPaymentStatusChange }) => (
  <div className="flex items-center justify-center space-x-2 h-full">
    <input
      type="checkbox"
      checked={Boolean(rowData.isPaid)}
      onChange={(e) => onPaymentStatusChange(rowData.id, e.target.checked)}
      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 border-[1px] border-solid rounded cursor-pointer"
      aria-label={`Mark token ${rowData.tokenNo} as ${rowData.isPaid ? 'unpaid' : 'paid'}`}
    />
    <span className={`flex items-center ${rowData.isPaid ? 'text-green-600' : 'text-red-600'}`}>
      {rowData.isPaid ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
    </span>
    <button
      type="button"
      onClick={() => onEdit(rowData)}
      className="text-amber-600 hover:text-amber-500 p-1 rounded-xl hover:bg-white"
      aria-label={`Edit token ${rowData.tokenNo}`}
    >
      <FiEdit2 className="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onClick={() => onDelete(rowData.id)}
      className="text-red-600 hover:text-red-500 p-1 rounded-xl hover:bg-white"
      aria-label={`Delete token ${rowData.tokenNo}`}
    >
      <FiTrash2 className="w-3.5 h-3.5" />
    </button>
  </div>
));

// Memoize DataCell component
const DataCell = memo(({ value, formatter }) => {
  if (value === null || value === undefined) {
    return <div className="flex items-center justify-center h-full text-xs text-gray-400">-</div>;
  }

  const formattedValue = formatter ? formatter(value) : value;

  return (
    <div
      className="flex items-center justify-center h-full text-xs text-amber-900 truncate px-1"
      // Without a title the truncated text is unrecoverable on hover.
      title={typeof formattedValue === 'string' ? formattedValue : undefined}
    >
      {formattedValue}
    </div>
  );
});

const TokenTable = ({ tokens = [], onEdit, onDelete, onPaymentStatusChange }) => {
  // Handle empty state
  const isEmpty = !tokens || tokens.length === 0;
  
  const columns = useMemo(() => [
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
  ], []);

  // Calculate minimum width needed
  const minTableWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  // Memoize handlers to prevent unnecessary re-renders
  const memoizedHandlers = useMemo(() => ({
    onEdit,
    onDelete,
    onPaymentStatusChange
  }), [onEdit, onDelete, onPaymentStatusChange]);

  const cellRenderer = useCallback(({ rowData, dataKey }) => {
    if (dataKey === 'actions') {
      return (
        <ActionsCell
          rowData={rowData}
          onEdit={memoizedHandlers.onEdit}
          onDelete={memoizedHandlers.onDelete}
          onPaymentStatusChange={memoizedHandlers.onPaymentStatusChange}
        />
      );
    }

    return (
      <DataCell
        value={rowData[dataKey]}
        formatter={formatters[dataKey]}
      />
    );
  }, [memoizedHandlers]);

  const headerRenderer = useCallback(({ label }) => (
    <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
      {label}
    </div>
  ), []);

  const getRowClassName = useCallback(({ index }) => 
    `${index === -1 ? 'bg-amber-500' : index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'} 
     ${index !== -1 ? 'hover:bg-amber-200' : ''} transition-colors`,
    []
  );

  // Handle empty state
  if (isEmpty) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tokens found
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-100 border-solid" style={{ height: '450px', overflow: 'hidden' }}>
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
              rowClassName={getRowClassName}
              overscanRowCount={5}
              role="grid"
              aria-label="Tokens table"
              aria-rowcount={tokens.length}
              aria-colcount={columns.length}
            >
              {columns.map(({ label, key, width, flexGrow }) => (
                <Column
                  key={key}
                  label={label}
                  dataKey={key}
                  width={width}
                  flexGrow={flexGrow}
                  cellRenderer={cellRenderer}
                  headerRenderer={headerRenderer}
                  className="divide-x divide-amber-100 rounded-xl"
                  style={{ overflow: 'hidden' }}
                />
              ))}
            </Table>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

// React Query replaces `tokens` with a new array only when the data actually
// changes, so reference equality is the correct and complete check. The previous
// hand-written comparator listed individual fields, which meant any new column
// would silently stop triggering a re-render.
export default memo(TokenTable);