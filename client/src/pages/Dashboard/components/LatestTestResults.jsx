import React from 'react';
import { FiAward } from 'react-icons/fi';
import { Card, CardHeader, EmptyState } from './Card';
import { cn } from '../../../lib/utils';
import { parseDate } from '../utils/dateUtils';

const CATEGORY_TONES = {
  '24K': 'bg-gold text-white',
  '22K': 'bg-gold-light text-gold-dark',
  '18K': 'bg-gold-soft text-gold-dark',
  Other: 'bg-ivory text-muted',
};

const formatDate = (date, time) => {
  const parsed = parseDate(date, time);
  if (Number.isNaN(parsed.getTime())) return date || '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const LatestTestResults = ({ results = [] }) => (
  <Card className="flex h-full flex-col">
    <CardHeader icon={FiAward} title="Latest Test Results" subtitle="Most recent purity readings" />
    <div className="flex-1 p-3">
      {results.length > 0 ? (
        <ul className="divide-y divide-hairline">
          {results.map((result, index) => (
            <li key={`${result.tokenNo}-${index}`} className="flex items-center justify-between gap-3 px-2 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'flex h-9 w-11 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                    CATEGORY_TONES[result.category] || CATEGORY_TONES.Other
                  )}
                >
                  {result.category}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{result.name}</p>
                  <p className="truncate text-xs text-muted">
                    #{result.tokenNo} · {formatDate(result.date, result.time)}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-ink">
                  {Number(result.goldFineness || 0).toFixed(2)}%
                </p>
                <p className="text-xs tabular-nums text-muted">
                  {Number(result.karat || 0).toFixed(2)}K
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={FiAward}
          title="No test results yet"
          message="Completed test results will be listed here."
        />
      )}
    </div>
  </Card>
);

export default LatestTestResults;
