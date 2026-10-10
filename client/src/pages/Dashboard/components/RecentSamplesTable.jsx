import React from 'react';
import { FiInbox, FiEye } from 'react-icons/fi';
import { Card, CardHeader, EmptyState } from './Card';

const RecentSamplesTable = ({ samples = [], onView }) => (
  <Card className="flex h-[31.5rem] flex-col">
    <CardHeader icon={FiInbox} title="Recent Samples" subtitle="Today's tests" />
    <div className="flex-1 overflow-y-auto p-2 sm:p-3">
      {samples.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 to-yellow-500 text-white [&>tr>th:first-child]:rounded-tl-xl [&>tr>th:last-child]:rounded-tr-xl">
              <tr className="text-left text-xs uppercase tracking-wide">
                <th className="w-20 whitespace-nowrap rounded-tl-xl px-3 py-1.5 text-left font-medium">Token No</th>
                <th className="whitespace-nowrap px-3 py-1.5 text-left font-medium">Customer</th>
                <th className="w-24 whitespace-nowrap px-3 py-1.5 text-right font-medium">Weight</th>
                <th className="w-28 whitespace-nowrap px-3 py-1.5 text-right font-medium">Gold Fineness</th>
                <th className="w-16 whitespace-nowrap rounded-tr-xl px-3 py-1.5 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample, index) => (
                <tr
                  key={`${sample.tokenNo}-${index}`}
                  className="border-t border-hairline align-middle transition-colors hover:bg-ivory"
                >
                  <td className="px-3 py-1 font-semibold tabular-nums text-ink">{sample.tokenNo}</td>
                  <td className="px-3 py-1">
                    <p className="max-w-[10rem] truncate leading-tight font-medium text-ink">{sample.name}</p>
                    {sample.sample && (
                      <p className="max-w-[10rem] truncate text-[11px] leading-tight text-muted">{sample.sample}</p>
                    )}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums text-muted">
                    {sample.weight ? `${Number(sample.weight).toFixed(3)} g` : '—'}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums text-muted">
                    {sample.goldFineness != null ? `${Number(sample.goldFineness).toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-3 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => onView?.(sample)}
                      aria-label={`View token ${sample.tokenNo}`}
                      title="View"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gold transition-colors hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={FiInbox}
          title="No tests today"
          message="Today's skin tests will appear here once they're saved."
        />
      )}
    </div>
  </Card>
);

export default RecentSamplesTable;
