import React, { useMemo } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiRotateCcw } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import LoadingSpinner from './LoadingSpinner';
import useDebounce from './hooks/useDebounce';

const CustomerList = ({
  loading,
  customers,
  searchQuery,
  setSearchQuery,
  handleEdit,
  confirmDelete,
  onReset
}) => {
  // Add debouncing to search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sort customers alphabetically by name and filter based on debounced search
  const sortedCustomers = useMemo(() => {
    return [...customers]
      .filter((customer) =>
        Object.values(customer)
          .join(" ")
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, debouncedSearchQuery]);

  const columns = useMemo(() => [
    { label: "Actions", key: "actions", width: 130, flexGrow: 0, minWidth: 130 },
    { label: "Code", key: "code", width: 100, flexGrow: 0, minWidth: 80 },
    { label: "Name", key: "name", width: 200, flexGrow: 1, minWidth: 120 },
    { label: "Phone", key: "phoneNumber", width: 150, flexGrow: 0, minWidth: 120 },
    { label: "Place", key: "place", width: 180, flexGrow: 1, minWidth: 100 }
  ], []);

  const minTableWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  );

  const cellRenderer = ({ rowData, dataKey }) => {
    if (dataKey === 'actions') {
      return (
        <div className="flex items-center justify-center space-x-2 px-2 min-w-[130px]">
          <button
            onClick={() => handleEdit(rowData)}
            className="text-amber-600 hover:text-amber-900 p-1.5 rounded hover:bg-amber-50"
            title="Edit customer"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => confirmDelete(rowData.id)}
            className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50"
            title="Delete customer"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }

    const value = rowData[dataKey];
    const column = columns.find(col => col.key === dataKey);
    
    return (
      <div 
        className="px-3 py-3 text-sm text-amber-900" 
        style={{ 
          minWidth: column?.minWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: dataKey === 'code' ? 'center' : 'flex-start'
        }}
      >
        <span className="truncate">
          {value || '-'}
        </span>
      </div>
    );
  };

  const headerRenderer = ({ label }) => (
    <div className="text-center text-xs font-medium text-white uppercase tracking-wider py-2">
      {label}
    </div>
  );

  return (
    <div className="mt-4 bg-white rounded-2xl p-3 border border-amber-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center">
          <BsQrCode className="w-5 h-5 text-amber-600 mr-2" />
          <h3 className="text-lg font-bold text-amber-900">
            Customer List
          </h3>
        </div>
        <div className="flex gap-2">
          <div className="relative rounded-md shadow-sm w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-md border border-amber-200 bg-white pl-10 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 py-2 text-sm text-amber-900 rounded-xl"
            />
          </div>
          {searchQuery && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-2 text-sm border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50 transition-all"
            >
              <FiRotateCcw className="mr-1.5 h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-amber-100 overflow-hidden" style={{ height: '450px' }}>
          <div style={{ width: '100%', height: '100%' }}>
            <AutoSizer>
              {({ height, width }) => (
                <div style={{ height, width }}>
                  <Table
                    width={Math.max(width, minTableWidth)}
                    height={height}
                    headerHeight={44}
                    rowHeight={48}
                    rowCount={sortedCustomers.length}
                    rowGetter={({ index }) => sortedCustomers[index]}
                    rowClassName={({ index }) => 
                      `${index === -1 ? 'bg-gradient-to-r from-amber-600 to-yellow-500' : 
                        index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'} 
                       ${index !== -1 ? 'hover:bg-amber-100/40' : ''} transition-colors`
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
        </div>
      )}
    </div>
  );
};

export default React.memo(CustomerList);
