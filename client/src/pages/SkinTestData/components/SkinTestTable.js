import React from 'react';
import { FiLoader } from 'react-icons/fi';

const SkinTestTable = ({ tests, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 text-[#D3B04D] animate-spin" />
      </div>
    );
  }

  if (!tests.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No skin tests found
      </div>
    );
  }

  const getColumnAlignment = (key, value) => {
    const numericColumns = ['token_no', 'id', 'age', 'price', 'quantity', 'amount'];
    const dateColumns = ['date', 'created_at', 'updated_at'];
    
    if (numericColumns.some(col => key.toLowerCase().includes(col))) return 'text-right';
    if (dateColumns.some(col => key.toLowerCase().includes(col))) return 'text-center';
    return 'text-left';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    
    // Format dates
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        return new Date(value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return value;
      }
    }
    
    // Format numbers
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });
    }
    
    return value;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[450px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D]">
                {Object.keys(tests[0] || {}).map((key) => (
                  <th
                    key={key}
                    className={`px-6 py-4 text-sm font-semibold text-white first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap ${getColumnAlignment(key, tests[0][key])}`}
                  >
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {tests.map((test, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-amber-50 transition-colors duration-200"
                >
                  {Object.entries(test).map(([key, value], cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className={`px-6 py-3 text-sm whitespace-nowrap ${getColumnAlignment(key, value)} text-gray-700`}
                    >
                      {formatValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SkinTestTable;
