import React, { useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { FiBarChart2 } from 'react-icons/fi';
import TimeSelector from './TimeSelector';
import { Card, CardHeader, EmptyState } from './Card';
import { parseDate } from '../utils/dateUtils';

const CHART_COLORS = {
  revenue: '#C69A32',       // Primary gold
  expenses: '#DC4444',      // Danger red (semantic)
  profit: '#16A36A',        // Success green (semantic)
  tokens: '#9A7019',        // Dark gold
  exchanges: '#667085',     // Muted slate
  exchangeCount: '#667085', // Muted slate (matches the "Exchange Count" data key)
  exchangeWeight: '#B08968',// Bronze
  exchangeExWeight: '#D8D2C4', // Sand
  skinTest: '#E4C46B',      // Light gold
  photoTest: '#FFD700'      // Bright gold
};

const CHART_SERIES = [
  ['revenue', 'Revenue', CHART_COLORS.revenue, 'left'],
  ['expenses', 'Expenses', CHART_COLORS.expenses, 'left'],
  ['profit', 'Profit', CHART_COLORS.profit, 'left'],
  ['tokens', 'Total Tokens', CHART_COLORS.tokens, 'right'],
  ['skinTest', 'Skin Tests', CHART_COLORS.skinTest, 'right'],
  ['photoTest', 'Photo Tests', CHART_COLORS.photoTest, 'right'],
  ['exchangeCount', 'Exchange Count', CHART_COLORS.exchanges, 'right'],
  ['exchangeWeight', 'Impure Weight', CHART_COLORS.exchangeWeight, 'right'],
  ['exchangeExWeight', 'Pure Weight', CHART_COLORS.exchangeExWeight, 'right']
];

const PERIOD_LABELS = {
  daily: 'last 30 days',
  weekly: 'last 12 weeks',
  monthly: 'last 12 months',
  yearly: 'last 5 years',
};

// Create a date cache with size limit for better performance and memory management
const MAX_CACHE_SIZE = 1000;
const dateCache = new Map();
const getDateKey = (date, format) => {
  const key = `${date}-${format}`;
  if (!dateCache.has(key)) {
    // Implement cache size limit
    if (dateCache.size >= MAX_CACHE_SIZE) {
      const firstKey = dateCache.keys().next().value;
      dateCache.delete(firstKey);
    }

    const d = new Date(date);
    // Adjust to local timezone by subtracting the offset
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    let formatted;
    switch (format) {
      case 'yearly':
        formatted = d.getFullYear().toString();
        break;
      case 'monthly':
        formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'weekly':
        const week = new Date(d);
        week.setDate(d.getDate() - d.getDay());
        formatted = `${week.getFullYear()}-${String(week.getMonth() + 1).padStart(2, '0')}-${String(week.getDate()).padStart(2, '0')}`;
        break;
      default:
        formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    dateCache.set(key, formatted);
  }
  return dateCache.get(key);
};

const formatSeriesValue = (name, value) => {
  if (['revenue', 'expenses', 'profit'].includes(String(name).toLowerCase())) {
    return `₹${Number(value).toLocaleString()}`;
  }
  if (name === 'Impure Weight' || name === 'Pure Weight') {
    return `${Number(value).toFixed(3)} g`;
  }
  if (name === 'Exchange Count') {
    return `${value}`;
  }
  return Number(value).toLocaleString();
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="min-w-24">{entry.name}</span>
          <span className="font-medium tabular-nums text-ink">
            {formatSeriesValue(entry.name, entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
};

const DashboardCharts = ({ tokens = [], expenses = [], exchanges = [], period = 'daily', setPeriod }) => {
  const chartData = useMemo(() => {
    try {
      const today = new Date();
      let startDate = new Date();

      // Time ranges chosen to match each selector label
      switch (period) {
        case 'yearly':
          startDate.setFullYear(today.getFullYear() - 5);
          break;
        case 'monthly':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'weekly':
          // Last 12 weeks, aligned to the start of the week
          startDate.setDate(today.getDate() - 7 * 12);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      // Pre-process data into maps for faster lookups
      const tokenMap = new Map();
      const expenseMap = new Map();
      const exchangeMap = new Map();

      // Improved weekly key generation for better aggregation
      const getWeekKey = (date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Adjust to local timezone
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay()); // Set to start of week (Sunday)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      // Process tokens with improved weekly handling
      (tokens || []).forEach(token => {
        const date = new Date(token.date);
        const key = period === 'weekly' ?
          getWeekKey(date) :
          getDateKey(token.date, period);

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            amount: 0,
            count: 0,
            skinTest: 0,
            photoTest: 0
          });
        }
        const data = tokenMap.get(key);
        data.amount += parseFloat(token.amount) || 0;
        data.count++;
        if (token.test === "Skin Testing") data.skinTest++;
        if (token.test === "Photo Testing") data.photoTest++;
      });

      // Process expenses with improved weekly handling
      (expenses || []).forEach(expense => {
        const date = new Date(expense.date);
        const key = period === 'weekly' ?
          getWeekKey(date) :
          getDateKey(expense.date, period);

        if (!expenseMap.has(key)) {
          expenseMap.set(key, 0);
        }
        expenseMap.set(key, expenseMap.get(key) + (parseFloat(expense.amount) || 0));
      });

      // Process exchanges with improved weekly handling
      (exchanges || []).forEach(exchange => {
        if (!exchange.date) return;
        try {
          const date = parseDate(exchange.date);
          if (isNaN(date.getTime())) return;
          const key = period === 'weekly' ?
            getWeekKey(date) :
            getDateKey(date.toISOString(), period);

          if (!exchangeMap.has(key)) {
            exchangeMap.set(key, { count: 0, weight: 0, exweight: 0 });
          }
          const data = exchangeMap.get(key);
          data.count++;
          data.weight += parseFloat(exchange.weight || '0');
          data.exweight += parseFloat(exchange.exweight || '0');
        } catch (err) {
          console.error('Error processing exchange:', err);
        }
      });

      // Generate data points with additional metrics
      const dataPoints = new Map();
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + (period === 'weekly' ? 7 : 1))) {
        const key = period === 'weekly' ? getWeekKey(d) : getDateKey(d, period);
        const tokenData = tokenMap.get(key) || {
          amount: 0, count: 0, skinTest: 0, photoTest: 0
        };
        const expenseAmount = expenseMap.get(key) || 0;
        const exchangeData = exchangeMap.get(key) || { count: 0, weight: 0, exweight: 0 };
        const profit = tokenData.amount - expenseAmount;

        dataPoints.set(key, {
          date: key,
          revenue: tokenData.amount,
          expenses: expenseAmount,
          profit: profit,
          tokens: tokenData.count,
          skinTest: tokenData.skinTest,
          photoTest: tokenData.photoTest,
          exchangeCount: exchangeData.count,
          exchangeWeight: exchangeData.weight,
          exchangeExWeight: exchangeData.exweight
        });
      }

      return Array.from(dataPoints.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [tokens, expenses, exchanges, period]);

  const formatDate = useCallback((date) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;

      switch (period) {
        case 'yearly':
          return d.getFullYear().toString();
        case 'monthly':
          return d.toLocaleString('default', { month: 'short', year: 'numeric' });
        case 'weekly':
          // Improved weekly date formatting
          const weekEnd = new Date(d);
          weekEnd.setDate(d.getDate() + 6);
          return `${d.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.getDate()}`;
        default:
          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
      }
    } catch {
      return date;
    }
  }, [period]);

  const hasData = chartData.some(
    (row) =>
      row.revenue ||
      row.expenses ||
      row.profit ||
      row.tokens ||
      row.exchangeCount ||
      row.exchangeWeight ||
      row.exchangeExWeight
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        icon={FiBarChart2}
        title="Statistics"
        subtitle={`Revenue, expenses, tokens & exchanges · ${PERIOD_LABELS[period] || ''}`}
        action={<TimeSelector period={period} setPeriod={setPeriod} />}
      />
      <div className="flex-1 p-5">
        {hasData ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                baseValue="dataMin"
              >
                <defs>
                  {Object.entries(CHART_COLORS).map(([name, color]) => (
                    <linearGradient key={name} id={`stat-color${name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#667085' }}
                  dy={6}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
                  tick={{ fontSize: 12, fill: '#667085' }}
                  width={56}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ fontSize: 12, fill: '#667085' }}
                  width={40}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: '#C69A32', strokeDasharray: '4 3' }}
                />
                {CHART_SERIES.map(([key, name, color, axis]) => (
                  <Area
                    key={key}
                    yAxisId={axis}
                    type="monotone"
                    dataKey={key}
                    name={name}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#stat-color${key})`}
                    fillOpacity={1}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={FiBarChart2}
            title="No statistics yet"
            message="Recorded tokens, expenses and exchanges will appear here."
          />
        )}
      </div>
    </Card>
  );
};

// Only re-render when the underlying data arrays change by reference
const MemoizedDashboardCharts = React.memo(DashboardCharts, (prevProps, nextProps) => {
  return prevProps.tokens === nextProps.tokens &&
         prevProps.expenses === nextProps.expenses &&
         prevProps.exchanges === nextProps.exchanges &&
         prevProps.period === nextProps.period;
});

export default MemoizedDashboardCharts;
