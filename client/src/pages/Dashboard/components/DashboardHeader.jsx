import React from 'react';
import TodayStats from './TodayStats';
import DateRangeSelector from './DateRangeSelector';

const DashboardHeader = ({ todayTotal, dateRange, onDateRangeChange }) => (
  <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0">
    <TodayStats todayTotal={todayTotal} />
    <DateRangeSelector dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
  </div>
);

export default DashboardHeader;