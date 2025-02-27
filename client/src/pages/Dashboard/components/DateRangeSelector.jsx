import React from 'react';

const DateRangeSelector = ({ dateRange, onDateRangeChange }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <label htmlFor="fromDate" className="text-sm font-medium text-amber-700 whitespace-nowrap">From:</label>
        <input
          type="date"
          id="fromDate"
          className="form-input w-full sm:w-auto rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-1 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500 text-amber-700 [&::-webkit-calendar-picker-indicator]:text-yellow-500 [&::-webkit-calendar-picker-indicator]:filter-yellow"
          value={dateRange.fromDate}
          onChange={(e) => onDateRangeChange({ ...dateRange, fromDate: e.target.value })}
          style={{ colorScheme: 'yellow' }}
        />
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <label htmlFor="toDate" className="text-sm font-medium text-amber-700 whitespace-nowrap">To:</label>
        <input
          type="date"
          id="toDate"
          className="form-input w-full sm:w-auto rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-1 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500 text-amber-700 [&::-webkit-calendar-picker-indicator]:text-yellow-500 [&::-webkit-calendar-picker-indicator]:filter-yellow"
          value={dateRange.toDate}
          onChange={(e) => onDateRangeChange({ ...dateRange, toDate: e.target.value })}
          style={{ colorScheme: 'yellow' }}
        />
      </div>
    </div>
  );
};

export default DateRangeSelector;