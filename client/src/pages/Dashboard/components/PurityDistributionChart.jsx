import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { FiPieChart } from 'react-icons/fi';
import { Card, CardHeader, EmptyState } from './Card';

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-hairline bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-ink">{item.name}</p>
      <p className="text-xs text-muted">
        {item.value} tests · {item.percent.toFixed(0)}%
      </p>
    </div>
  );
};

const PurityDistributionChart = ({ purity }) => {
  const slices = purity?.slices || [];
  const total = purity?.total || 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader icon={FiPieChart} title="Purity Distribution" subtitle="Completed tests by karat" />
      <div className="flex flex-1 flex-col p-5">
        {total > 0 ? (
          <>
            <div className="relative mx-auto h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-ink">{total}</span>
                <span className="text-xs text-muted">tests</span>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {slices.map((slice) => (
                <li key={slice.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                    {slice.name}
                  </span>
                  <span className="tabular-nums text-ink">
                    <span className="font-semibold">{slice.value}</span>
                    <span className="ml-1 text-xs text-muted">{slice.percent.toFixed(0)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            icon={FiPieChart}
            title="No results in this period"
            message="Purity breakdown appears once skin tests are completed."
          />
        )}
      </div>
    </Card>
  );
};

export default React.memo(PurityDistributionChart);
