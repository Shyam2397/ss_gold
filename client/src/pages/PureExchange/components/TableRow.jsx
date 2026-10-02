import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

const TableRow = ({ row, index, onRemove }) => {
    return (
        <tr className="hover:bg-amber-50/50">
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {index + 1}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {row.tokenNo}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {row.name}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {row.date}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {row.time}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.weight).toFixed(3)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.highest).toFixed(2)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.hWeight).toFixed(3)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.average).toFixed(2)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.aWeight).toFixed(3)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.goldFineness).toFixed(2)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.gWeight).toFixed(3)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.exGold).toFixed(2)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(row.exWeight).toFixed(3)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap text-sm">
                <button
                    type="button"
                    onClick={() => onRemove(row.tokenNo)}
                    title={`Remove token ${row.tokenNo}`}
                    aria-label={`Remove token ${row.tokenNo}`}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                    <FiTrash2 className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
};

// Memoization comparison function
const areEqual = (prevProps, nextProps) => {
    // Only re-render if the row data has changed.
    // onRemove is compared too: a stale handler here would remove the wrong row.
    return (
        prevProps.row === nextProps.row &&
        prevProps.index === nextProps.index &&
        prevProps.onRemove === nextProps.onRemove
    );
};

export default React.memo(TableRow, areEqual);