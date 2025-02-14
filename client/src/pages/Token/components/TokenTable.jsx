import React from 'react';
import { FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const formatDateToIST = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Manually format to DD-MM-YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
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
    "Token No",
    "Date",
    "Time",
    "Code",
    "Name",
    "Test",
    "Weight",
    "Sample",
    "Amount"
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-amber-100">
      <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
        <table className="w-full table-fixed divide-y divide-amber-100">
          <thead className="bg-amber-500 sticky top-0 z-10">
            <tr>
              <th className="w-[130px] px-2 py-2 text-center text-xs font-medium text-white uppercase tracking-wider">
                Actions
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-2 py-2 text-center text-xs font-medium text-white uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-50">
            {tokens.map((token, index) => (
              <tr
                key={token.id || index}
                className="hover:bg-amber-50/40 transition-colors"
              >
                <td className="w-[130px] px-2 py-2 whitespace-nowrap text-center align-middle">
                  <div className="flex items-center justify-center space-x-2">
                    <input
                      type="checkbox"
                      checked={token.isPaid}
                      onChange={(e) => onPaymentStatusChange(token.id, e.target.checked)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span className={`flex items-center ${token.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      {token.isPaid ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                    </span>
                    <button
                      onClick={() => onEdit(token)}
                      className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                      title="Edit Token"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(token.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete Token"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                {columns.map((column) => {
                  let displayValue = token[column.toLowerCase().replace(/\s/g, '')];
                  
                  if (column === 'Token No') {
                    displayValue = token.tokenno || token.tokenNo || token['token no'] || 'N/A';
                  }
                  
                  if (column === 'Date') {
                    displayValue = formatDateToIST(displayValue);
                  } else if (column === 'Time') {
                    displayValue = formatTimeToIST(displayValue);
                  } else if (column === 'Weight') {
                    displayValue = parseFloat(displayValue).toFixed(3);
                  }

                  return (
                    <td
                      key={column}
                      className="px-2 py-2 whitespace-nowrap text-center text-xs text-amber-900 truncate align-middle"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenTable;
