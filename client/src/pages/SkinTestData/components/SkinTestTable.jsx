import React from 'react';
import { FiLoader } from 'react-icons/fi';

const SkinTestTable = ({ tests, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <FiLoader className="h-6 w-6 text-[#D3B04D] animate-spin" />
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
    const numericColumns = ['token_no', 'age', 'price', 'quantity', 'amount'];
    const dateColumns = ['date', 'created_at', 'updated_at'];
    
    if (numericColumns.some(col => key.toLowerCase().includes(col))) return 'text-right';
    if (dateColumns.some(col => key.toLowerCase().includes(col))) return 'text-center';
    return 'text-left';
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

    // Format time to 12-hour format
    if (key === 'time' && typeof value === 'string') {
      try {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const period = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12;
          return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
      } catch (e) {
        console.warn('Error formatting time:', e);
      }
      return value;
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

  const filterColumns = (obj) => {
    const excludedColumns = ['id', 'created_at', 'updated_at'];
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !excludedColumns.includes(key))
    );
  };

  const firstTest = filterColumns(tests[0]);
  const headers = Object.keys(firstTest);

  return (
    <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D] text-white">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-5 py-3.5 text-center font-semibold text-sm whitespace-nowrap"
                  >
                    {header.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {tests.map((test) => {
                const filteredTest = filterColumns(test);
                return (
                  <tr
                    key={test.id}
                    className="border-b border-amber-100 hover:bg-amber-50/70 transition-colors duration-150"
                  >
                    {headers.map((header) => (
                      <td
                        key={header}
                        className={`px-5 py-2.5 text-center whitespace-nowrap ${getColumnAlignment(header, filteredTest[header])}`}
                      >
                        {formatValue(filteredTest[header], header)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SkinTestTable;
