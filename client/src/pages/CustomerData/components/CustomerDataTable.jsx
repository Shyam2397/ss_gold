import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

const CustomerDataTable = ({ entries, onDelete }) => {
  return (
    <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[625px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-amber-500 text-white rounded-t-xl">
                <th className="px-5 py-2.5 text-center font-semibold text-sm">Name</th>
                <th className="px-5 py-2.5 text-center font-semibold text-sm hidden sm:table-cell">Phone Number</th>
                <th className="px-5 py-2.5 text-center font-semibold text-sm hidden sm:table-cell">Code</th>
                <th className="px-5 py-2.5 text-center font-semibold text-sm hidden sm:table-cell">Place</th>
                <th className="px-5 py-2.5 text-center font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className="border-b border-amber-100 hover:bg-amber-50/70 transition-colors duration-150 text-amber-900"
                >
                  <td className="px-5 py-2.5 whitespace-nowrap text-left font-medium text-sm">
                    {entry.name}
                    <dl className="sm:hidden mt-0.5">
                      <dd className="text-xs">{entry.phoneNumber}</dd>
                      <dd className="text-xs">{entry.code}</dd>
                      <dd className="text-xs">{entry.place}</dd>
                    </dl>
                  </td>
                  <td className="px-5 py-2.5 whitespace-nowrap hidden sm:table-cell text-center text-sm">{entry.phoneNumber}</td>
                  <td className="px-5 py-2.5 whitespace-nowrap hidden sm:table-cell text-center text-sm">{entry.code}</td>
                  <td className="px-5 py-2.5 whitespace-nowrap hidden sm:table-cell text-left text-sm">{entry.place}</td>
                  <td className="px-5 py-2.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => onDelete(entry.id)}
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

export default CustomerDataTable;
