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
            onClick={() => onDelete(rowData.tokenno)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Test"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onPrint(rowData)}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
            title="Print Test"
          >
            <FiPrinter className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      {columns.map((column) => {
        let displayValue = rowData[column.toLowerCase().replace(/\s/g, '')];
        
        // Format specific columns
        if (column === 'Weight') {
          displayValue = parseFloat(displayValue).toFixed(3);
        } else if (column === 'Date') {
          const date = new Date(displayValue);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          displayValue = `${day}-${month}-${year}`;
        } else if (column === 'Time') {
          const [hours, minutes] = displayValue.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes));
          displayValue = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }

        return (
          <td 
            key={column} 
            className={`px-2 py-2 text-center text-xs text-gray-900 align-middle overflow-hidden ${
              column === 'weight' ? 'w-[100px]' : 
              column === 'tokenNo' ? 'w-[100px]' : 
              column === 'date' ? 'w-[100px]' : 
              column === 'time' ? 'w-[100px]' : 
              column === 'name' ? 'w-[150px]' : 
              'min-w-[100px]'
            }`}
          >
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
