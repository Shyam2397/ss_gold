import React from 'react';
import { FiEdit2, FiTrash2, FiPrinter } from 'react-icons/fi';

const TableRow = ({ 
  rowData, 
  onEdit, 
  onDelete, 
  onPrint, 
  columns 
}) => {
  return (
    <tr 
      className="hover:bg-amber-50 transition-colors duration-200 group"
    >
      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-amber-900">
        <div className="flex space-x-1.5 sm:space-x-2">
          <button 
            onClick={() => onEdit(rowData)}
            className="text-amber-600 hover:text-amber-900 transition-colors duration-200 p-1 sm:p-1.5 rounded-full hover:bg-amber-100"
            title="Edit Test"
          >
            <FiEdit2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => onDelete(rowData.id)}
            className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 sm:p-1.5 rounded-full hover:bg-red-100"
            title="Delete Test"
          >
            <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => onPrint(rowData)}
            className="text-green-600 hover:text-green-900 transition-colors duration-200 p-1 sm:p-1.5 rounded-full hover:bg-green-100"
            title="Print Test"
          >
            <FiPrinter className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </td>
      {columns.map((column) => (
        <td 
          key={column} 
          className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900"
        >
          {rowData[column.toLowerCase().replace(/\s/g, '')]}
        </td>
      ))}
    </tr>
  );
};

export default TableRow;
