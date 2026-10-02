import React from 'react';

// Skeleton for table rows
export const TableRowSkeleton = () => {
  return (
    <tr className="animate-pulse">
      {/* 15 cells: 14 data columns plus the trailing row-action column. */}
      {Array(15).fill(0).map((_, index) => (
        <td key={index} className="px-2 py-1.5 whitespace-nowrap">
          <div className="h-4 bg-amber-100/80 rounded w-12"></div>
        </td>
      ))}
    </tr>
  );
};

// Skeleton for the entire table with multiple rows.
// Only rendered when no rows are staged yet - once a batch exists the real rows
// stay on screen through a save.
export const TableSkeleton = ({ rowCount = 3 }) => {
  return (
    <>
      {Array(rowCount).fill(0).map((_, index) => (
        <TableRowSkeleton key={index} />
      ))}
    </>
  );
};
