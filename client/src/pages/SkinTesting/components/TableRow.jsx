import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/validation';

const TableRow = ({ 
  rowData, 
  onEdit, 
  onDelete, 
  columns 
}) => {
  return (
    <tr className="hover:bg-amber-50/40 transition-colors whitespace-nowrap">
      <td className="sticky left-0 z-10 bg-white group-hover:bg-amber-50/40 w-[130px] px-2 py-2 text-center align-middle">
        <div className="flex items-center justify-center space-x-2">
          <button 
            onClick={() => onEdit(rowData)}
            className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
            title="Edit Test"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(rowData.tokenNo || rowData.tokenno)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Test"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      {columns.map((column) => {
        const key = column.toLowerCase().replace(/\s/g, '');
        let displayValue = rowData[key];
        
        // Format specific columns
        if (key === 'date') {
          displayValue = formatDateForDisplay(displayValue);
        } else if (key === 'time') {
          displayValue = formatTimeForDisplay(displayValue);
        } else if (key === 'weight') {
          displayValue = parseFloat(displayValue).toFixed(3);
        }

        return (
          <td key={column} className={`px-2 py-2 text-center text-xs text-gray-900 align-middle overflow-hidden ${
            column === 'weight' ? 'w-[100px]' : 
            column === 'tokenNo' ? 'w-[100px]' : 
            column === 'date' ? 'w-[100px]' : 
            column === 'time' ? 'w-[100px]' : 
            column === 'name' ? 'w-[150px]' : 
            'min-w-[100px]'
          }`}>
            <div className="truncate" title={displayValue}>
              {displayValue}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
