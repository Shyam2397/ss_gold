import React from 'react';
import { FiLoader, FiTrash2 } from 'react-icons/fi';

const getColumnAlignment = (key) => {
  const numericColumns = ['amount', 'rate', 'quantity', 'token_no'];
  const dateColumns = ['date', 'created_at', 'updated_at'];
  
  if (numericColumns.some(col => key.toLowerCase().includes(col))) return 'text-right';
  if (dateColumns.some(col => key.toLowerCase().includes(col))) return 'text-center';
  return 'text-left';
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
                    {[...exchanges].reverse().map((exchange, index) => (
                      <tr
                        key={exchange.token_no || index}
                        className="hover:bg-amber-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => onDelete(exchange.token_no)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete Exchange"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
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
