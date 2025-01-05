import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

const CustomerDataTable = ({ entries, onDelete }) => {
  return (
    <div className="mt-4 bg-white rounded-2xl shadow-inner overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[450px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D] text-white">
                <th className="px-6 py-4 text-left font-semibold">Name</th>
                <th className="px-6 py-4 text-left font-semibold hidden sm:table-cell">Phone Number</th>
                <th className="px-6 py-4 text-left font-semibold hidden sm:table-cell">Code</th>
                <th className="px-6 py-4 text-left font-semibold hidden sm:table-cell">Place</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className="border-b border-amber-100 hover:bg-amber-50 transition-colors duration-200"
                >
                  <td className="px-6 py-3 whitespace-nowrap font-medium">
                    {entry.name}
                    <dl className="sm:hidden mt-1">
                      <dd className="text-sm text-gray-600">{entry.phoneNumber}</dd>
                      <dd className="text-sm text-gray-600">{entry.code}</dd>
                      <dd className="text-sm text-gray-600">{entry.place}</dd>
                    </dl>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">{entry.phoneNumber}</td>
                  <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">{entry.code}</td>
                  <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">{entry.place}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <FiTrash2 className="h-5 w-5" />
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

export default CustomerDataTable;
