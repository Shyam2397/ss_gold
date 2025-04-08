import React from 'react';

// Skeleton for form inputs
export const FormInputSkeleton = ({ className }) => {
  return (
    <div className={`form-control animate-pulse ${className}`}>
      <div className="h-3 w-16 bg-amber-200/60 rounded mb-1"></div>
      <div className="h-7 w-full bg-amber-100/80 rounded border border-amber-200/40 border-solid"></div>
    </div>
  );
};

// Skeleton for table rows
export const TableRowSkeleton = () => {
  return (
    <tr className="animate-pulse">
      {Array(14).fill(0).map((_, index) => (
        <td key={index} className="px-2 py-1.5 whitespace-nowrap">
          <div className="h-4 bg-amber-100/80 rounded w-12"></div>
        </td>
      ))}
    </tr>
  );
};

// Skeleton for the entire table with multiple rows
export const TableSkeleton = ({ rowCount = 3 }) => {
  return (
    <>
      {Array(rowCount).fill(0).map((_, index) => (
        <TableRowSkeleton key={index} />
      ))}
    </>
  );
};

// Button skeleton
export const ButtonSkeleton = ({ width = 'w-20', height = 'h-[30px]' }) => {
  return (
    <div className={`${width} ${height} bg-amber-300/50 rounded animate-pulse`}></div>
  );
};