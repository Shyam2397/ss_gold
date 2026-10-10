import React from 'react';
import { FiInbox } from 'react-icons/fi';
import { Card, CardHeader, EmptyState } from './Card';
import { cn } from '../../../lib/utils';
import { parseDate } from '../utils/dateUtils';

const formatDate = (date, time) => {
  const parsed = parseDate(date, time);
  if (Number.isNaN(parsed.getTime())) return date || '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Badge = ({ tone, children }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      tone === 'success' && 'bg-brandsuccess/10 text-brandsuccess',
      tone === 'warning' && 'bg-brandwarning/10 text-brandwarning',
      tone === 'danger' && 'bg-branddanger/10 text-branddanger'
    )}
  >
    {children}
  </span>
);

const RecentSamplesTable = ({ samples = [] }) => (
  <Card className="flex h-full flex-col">
    <CardHeader icon={FiInbox} title="Recent Samples" subtitle="Latest registered samples" />
    <div className="flex-1 p-2 sm:p-3">
      {samples.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">Token</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Test</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample, index) => (
                <tr
                  key={`${sample.tokenNo}-${index}`}
                  className="border-t border-hairline transition-colors hover:bg-ivory"
                >
                  <td className="px-3 py-2.5 font-semibold tabular-nums text-ink">{sample.tokenNo}</td>
                  <td className="px-3 py-2.5">
                    <p className="max-w-[10rem] truncate font-medium text-ink">{sample.name}</p>
                    {sample.sample && <p className="max-w-[10rem] truncate text-xs text-muted">{sample.sample}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{sample.test}</td>
                  <td className="px-3 py-2.5 tabular-nums text-muted">{formatDate(sample.date, sample.time)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={sample.paid ? 'success' : 'danger'}>{sample.paid ? 'Paid' : 'Unpaid'}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={sample.completed ? 'success' : 'warning'}>
                      {sample.completed ? 'Completed' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={FiInbox}
          title="No samples yet"
          message="Registered samples will show up here as they come in."
        />
      )}
    </div>
  </Card>
);

export default RecentSamplesTable;
