import React from 'react';
import { FiLoader, FiTrash2 } from 'react-icons/fi';

const getColumnAlignment = (key) => {
  const numericColumns = ['token_no', 'age', 'price', 'quantity', 'amount'];
  const dateColumns = ['date', 'created_at', 'updated_at'];
  
  if (numericColumns.some(col => key.toLowerCase().includes(col))) return 'text-right';
  if (dateColumns.some(col => key.toLowerCase().includes(col))) return 'text-center';
  return 'text-left';
};

const formatValue = (value, key) => {
  if (value === null || value === undefined) return '-';
  
  // Handle isPaid status with colored badge
  if (key === 'isPaid') {
    const isPaid = value === true || value === 1 || value === 'true' || value === '1';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPaid 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isPaid ? 'Paid' : 'Not Paid'}
      </span>
    );
  }
  
  // Format dates with multiple parsing strategies
  if ((key === 'date' || key === 'time') && typeof value === 'string') {
    if (key === 'time') {
      // Handle time format
      try {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const period = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12; // Convert to 12-hour format
          return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
      } catch (e) {
        return value;
      }
    }

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

const TokenTable = ({ 
  tokens, 
  loading, 
  onDelete 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <FiLoader className="h-7 w-7 text-[#D3B04D] animate-spin" />
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-inner p-5 text-center text-gray-500">
        No tokens found.
      </div>
    );
  }

  const columns = Object.keys(filterColumns(tokens[0]));

  return (
    <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D] text-white">
                {columns.map(column => (
                  <th
                    key={column}
                    className="px-5 py-3.5 text-center font-semibold text-sm whitespace-nowrap text-center"
                  >
                    {column.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-center font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tokens.map((token, index) => (
                <tr
                  key={token.id}
                  className="border-b border-amber-100 hover:bg-amber-50/70 transition-colors duration-150"
                >
                  {columns.map(column => (
                    <td
                      key={column}
                      className={`px-5 py-2.5 whitespace-nowrap text-center ${getColumnAlignment(column)} text-sm`}
                    >
                      {formatValue(token[column], column)}
                    </td>
                  ))}
                  <td className="px-5 py-2.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => onDelete(token.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-150"
                    >
                      <FiTrash2 className="h-4.5 w-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TokenTable;
