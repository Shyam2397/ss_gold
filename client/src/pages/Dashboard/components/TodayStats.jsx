import React from 'react';

const TodayStats = ({ todayTotal }) => {
  return (
    <div className="flex items-center space-x-4 w-full sm:w-auto">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-amber-700">Today's Revenue</span>
        <span className="text-lg font-bold text-yellow-600">{todayTotal.formattedRevenue}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-amber-700">Today's Expenses</span>
        <span className="text-lg font-bold text-red-600">{todayTotal.formattedExpenses}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-amber-700">Today's Net Total</span>
        <span className={`text-lg font-bold ${todayTotal.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {todayTotal.formattedNetTotal}
        </span>
      </div>
    </div>
  );
};

export default TodayStats;