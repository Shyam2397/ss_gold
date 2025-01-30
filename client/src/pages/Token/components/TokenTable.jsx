import React from 'react';
import { FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const TokenTable = ({ tokens = [], onEdit, onDelete, onPaymentStatusChange }) => {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tokens found
      </div>
    );
  }

  const columns = [
    "Status",
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
        <table className="min-w-full divide-y divide-amber-200">
          <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
              <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-100">
            {tokens.map((token, index) => (
              <tr
                key={index}
                className="hover:bg-amber-50 transition-colors duration-200"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 whitespace-nowrap text-base sm:text-lg text-gray-900"
                  >
                    {token[column.toLowerCase().replace(/\s/g, '')]}
                  </td>
                ))}
                <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 whitespace-nowrap text-base sm:text-lg font-medium space-x-2 sm:space-x-4 flex items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={token.isPaid}
                      onChange={() => onPaymentStatusChange(token.id, !token.isPaid)}
                      className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span className={`ml-2 ${token.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      {token.isPaid ? <FiCheckCircle className="text-green-600" /> : <FiXCircle className="text-red-600" />}
                    </span>
                  </div>
                  <button
                    onClick={() => onEdit(token)}
                    className="text-amber-600 hover:text-amber-900 transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-amber-100"
                    title="Edit Token"
                  >
                    <FiEdit2 className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                  <button
                    onClick={() => onDelete(token.id)}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-red-100"
                    title="Delete Token"
                  >
                    <FiTrash2 className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenTable;
