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

  return (
    <div className="overflow-hidden rounded-lg border border-amber-100">
      <div className="overflow-x-auto">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
          <table className="min-w-full divide-y divide-amber-200">
            <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
              <tr>
                {[
                  "Actions",
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
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-2 text-left text-sm font-medium text-white uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {tokens.map((token) => (
                <tr
                  key={token.id}
                  className="hover:bg-amber-50"
                >
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(token)}
                        className="text-amber-600 hover:text-amber-900"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(token.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={token.isPaid}
                        onChange={() => onPaymentStatusChange(token.id, !token.isPaid)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className={`ml-2 ${token.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {token.isPaid ? <FiCheckCircle className="text-green-600" /> : <FiXCircle className="text-red-600" />}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.tokenNo}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.date}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.time}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.code}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.test}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.weight}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.sample}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {token.amount}
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
