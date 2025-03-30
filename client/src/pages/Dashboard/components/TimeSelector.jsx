import React from 'react';

const TimeSelector = ({ period, setPeriod }) => {
  const periods = ['daily', 'weekly', 'monthly', 'yearly'];

  return (
    <div className="flex space-x-2">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1 rounded-md text-sm ${
            period === p ? 'bg-yellow-100 text-yellow-900' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default React.memo(TimeSelector, (prev, next) => {
  return prev.period === next.period;
});
