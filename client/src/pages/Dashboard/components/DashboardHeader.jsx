import React from 'react';
import TodayStats from './TodayStats';

const DashboardHeader = ({ todayTotal }) => (
  <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm space-y-4 sm:space-y-0">
    <TodayStats todayTotal={todayTotal} />
  </div>
);

export default React.memo(DashboardHeader, (prev, next) => {
  return JSON.stringify(prev.todayTotal) === JSON.stringify(next.todayTotal) &&
         prev.dateRange === next.dateRange;
});
