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
    const numericColumns = ['token_no', 'age', 'price', 'quantity', 'amount'];
    const dateColumns = ['date', 'created_at', 'updated_at'];
    
    if (numericColumns.some(col => key.toLowerCase().includes(col))) return 'text-right';
    if (dateColumns.some(col => key.toLowerCase().includes(col))) return 'text-center';
    return 'text-left';
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-';
    
    // Format dates with multiple parsing strategies
    if (key === 'date' && typeof value === 'string') {
      // Try parsing with different strategies
      const parseDate = (dateStr) => {
        // Try ISO format
        let parsedDate = new Date(dateStr);
        
        // If ISO parsing fails, try manual parsing
        if (isNaN(parsedDate)) {
          // Common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
          const formats = [
            /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,  // DD/MM/YYYY or DD-MM-YYYY
            /^(\d{4})-(\d{2})-(\d{2})$/,            // YYYY-MM-DD
            /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/   // DD/MM/YY or MM/DD/YY
          ];
          
          for (const regex of formats) {
            const match = dateStr.match(regex);
            if (match) {
              let year, month, day;
              if (match[3].length === 4) {
                // YYYY-MM-DD or DD/MM/YYYY
                year = match[3];
                month = match[2];
                day = match[1];
              } else {
                // YY format or swapped
                year = match[3].length === 2 ? 
                  (parseInt(match[3]) > 50 ? '19' : '20') + match[3] : 
                  match[3];
                month = match[1];
                day = match[2];
              }
              
              parsedDate = new Date(year, month - 1, day);
              break;
            }
          }
        }
        
        return parsedDate;
      };
      
      const parsedDate = parseDate(value);
      
      if (!isNaN(parsedDate)) {
        return parsedDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
      }
      
      // If all parsing fails, return original value
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
    const { id, ...rest } = obj;
    return rest;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[450px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D]">
                {Object.keys(filterColumns(tests[0] || {})).map((key) => (
                  <th
                    key={key}
                    className={`px-6 py-4 text-sm font-semibold text-white first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap ${getColumnAlignment(key, filterColumns(tests[0] || {})[key])}`}
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
                  {Object.entries(filterColumns(test)).map(([key, value], cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className={`px-6 py-3 text-sm whitespace-nowrap ${getColumnAlignment(key, value)} text-gray-700`}
                    >
                      {formatValue(value, key)}
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
