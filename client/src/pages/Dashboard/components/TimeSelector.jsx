import React from 'react';
import { cn } from '../../../lib/utils';

const PERIODS = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
];

const TimeSelector = ({ period, setPeriod }) => {
  return (
    <div
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-xl border border-hairline bg-white p-1"
      role="tablist"
      aria-label="Time period"
    >
      {PERIODS.map(({ key, label }) => {
        const active = period === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-pressed={active}
            onClick={() => setPeriod(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
              active ? 'bg-gold text-white shadow-sm' : 'text-muted hover:bg-ivory hover:text-ink'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(TimeSelector, (prev, next) => prev.period === next.period);
