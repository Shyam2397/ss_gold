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
    <div className="overflow-x-auto rounded-xl border-2 border-amber-100">
      <div className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
        <table className="w-full table-fixed divide-y divide-amber-200">
          <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
            <tr>
              <th className="w-[150px] px-2 py-3 text-center text-sm font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-2 py-3 text-center text-sm font-semibold text-white uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-100">
            {tokens.map((token, index) => (
              <tr
                key={index}
                className="hover:bg-amber-50 transition-colors duration-200"
              >
                <td className="w-[150px] px-2 py-3 whitespace-nowrap text-base font-medium flex items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={token.isPaid}
                      onChange={() => onPaymentStatusChange(token.id, !token.isPaid)}
                      className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span className={`ml-3 ${token.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      {token.isPaid ? <FiCheckCircle className="text-green-600 w-5 h-5" /> : <FiXCircle className="text-red-600 w-5 h-5" />}
                    </span>
                  </div>
                    <button
                      onClick={() => onEdit(token)}
                    className="text-amber-600 hover:text-amber-900 transition-colors duration-200 p-2 rounded-full hover:bg-amber-100 ml-3"
                      title="Edit Token"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(token.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-full hover:bg-red-100"
                      title="Delete Token"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                </td>
                {columns.map((column) => {
                  let displayValue = token[column.toLowerCase().replace(/\s/g, '')];
                  
                  // Special handling for Token No column
                  if (column === 'Token No') {
                    displayValue = token.tokenno || token.tokenNo || token['token no'] || 'N/A';
                  }
                  
                  // Format date and time
                  if (column === 'Date') {
                    displayValue = formatDateToIST(displayValue);
                  } else if (column === 'Time') {
                    displayValue = formatTimeToIST(displayValue);
                  }
                  
                  return (
                    <td
                      key={column}
                      className="px-2 py-3 whitespace-nowrap text-base text-gray-900 truncate"
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
