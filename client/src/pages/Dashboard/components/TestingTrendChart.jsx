import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
} from 'recharts';
import { FiActivity } from 'react-icons/fi';
import { Card, CardHeader, EmptyState } from './Card';

const AREAS = [
  { key: '24K', color: '#C69A32' },
  { key: '22K', color: '#E4C46B' },
  { key: '18K', color: '#9A7019' },
  { key: 'Other', color: '#D8D2C4' },
];

const PERIOD_LABELS = {
  daily: 'last 7 days',
  weekly: 'last 8 weeks',
  monthly: 'last 6 months',
  yearly: 'last 5 years',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="min-w-14">{entry.dataKey}</span>
          <span className="font-medium tabular-nums text-ink">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const Legend = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
    {AREAS.map(({ key, color }) => (
      <span key={key} className="flex items-center gap-1.5 text-xs text-muted">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
        {key}
      </span>
    ))}
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span className="h-0.5 w-3.5 rounded-full bg-ink" />
      Samples
    </span>
  </div>
);

const TestingTrendChart = ({ data = [], period = 'monthly' }) => {
  const hasData = data.some(
    (row) => row['24K'] || row['22K'] || row['18K'] || row.Other || row.Samples
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        icon={FiActivity}
        title="Testing Trend"
        subtitle={`Completed tests · ${PERIOD_LABELS[period] || ''}`}
        action={<Legend />}
      />
      <div className="flex-1 p-5">
        {hasData ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  {AREAS.map(({ key, color }) => (
                    <linearGradient key={key} id={`trend-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.45} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#667085' }}
                  dy={6}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#667085' }}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(198,154,50,0.06)' }} />
                {AREAS.map(({ key }) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="purity"
                    stroke={AREAS.find((a) => a.key === key).color}
                    fill={`url(#trend-${key})`}
                    strokeWidth={1}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="Samples"
                  stroke="#202020"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={FiActivity}
            title="No testing activity yet"
            message="Completed skin tests in this period will appear here."
          />
        )}
      </div>
    </Card>
  );
};

export default React.memo(TestingTrendChart);
