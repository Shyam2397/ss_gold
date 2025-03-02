import React, { useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TimeSelector from './TimeSelector';

const CHART_COLORS = {
  revenue: '#F7DC6F',
  expenses: '#EF4444',
  profit: '#10B981',
  tokens: '#EC4899',
  exchanges: '#8B5CF6'
};

const CHART_SERIES = [
  ['revenue', 'Revenue', CHART_COLORS.revenue, 'left'],
  ['expenses', 'Expenses', CHART_COLORS.expenses, 'left'],
  ['profit', 'Profit', CHART_COLORS.profit, 'left'],
  ['tokens', 'Tokens', CHART_COLORS.tokens, 'right'],
  ['exchanges', 'Exchanges', CHART_COLORS.exchanges, 'right']
];

// Create a date cache for better performance
const dateCache = new Map();
const getDateKey = (date, format) => {
  const key = `${date}-${format}`;
  if (!dateCache.has(key)) {
    const d = new Date(date);
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
        formatted = week.toISOString().split('T')[0];
        break;
      default:
        formatted = d.toISOString().split('T')[0];
    }
    dateCache.set(key, formatted);
  }
  return dateCache.get(key);
};

const DashboardCharts = ({ tokens = [], expenses = [], entries = [], exchanges = [] }) => {
  const [period, setPeriod] = useState('daily');

  const chartData = useMemo(() => {
    try {
      const today = new Date();
      let startDate = new Date();
      
      // Set time range
      switch (period) {
        case 'yearly':
          startDate.setFullYear(today.getFullYear() - 5);
          break;
        case 'monthly':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'weekly':
          startDate.setMonth(today.getMonth() - 3);
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      // Pre-process data into maps for faster lookups
      const tokenMap = new Map();
      const expenseMap = new Map();
      const exchangeMap = new Map();

      tokens.forEach(token => {
        const key = getDateKey(token.date, period);
        if (!tokenMap.has(key)) {
          tokenMap.set(key, { amount: 0, count: 0 });
        }
        const data = tokenMap.get(key);
        data.amount += parseFloat(token.amount) || 0;
        data.count++;
      });

      expenses.forEach(expense => {
        const key = getDateKey(expense.date, period);
        if (!expenseMap.has(key)) {
          expenseMap.set(key, 0);
        }
        expenseMap.set(key, expenseMap.get(key) + (parseFloat(expense.amount) || 0));
      });

      exchanges.forEach(exchange => {
        const key = getDateKey(exchange.date.split('-').reverse().join('-'), period);
        if (!exchangeMap.has(key)) {
          exchangeMap.set(key, { count: 0, weight: 0 });
        }
        const data = exchangeMap.get(key);
        data.count++;
        data.weight += parseFloat(exchange.weight) || 0;
      });

      // Generate data points
      const dataPoints = new Map();
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const key = getDateKey(d, period);
        const tokenData = tokenMap.get(key) || { amount: 0, count: 0 };
        const expenseAmount = expenseMap.get(key) || 0;
        const exchangeData = exchangeMap.get(key) || { count: 0, weight: 0 };

        if (!dataPoints.has(key)) {
          dataPoints.set(key, {
            date: key,
            revenue: tokenData.amount,
            expenses: expenseAmount,
            profit: tokenData.amount - expenseAmount,
            tokens: tokenData.count,
            exchanges: exchangeData.count,
            weight: exchangeData.weight
          });
        }
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
          return `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`;
        default:
          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
      }
    } catch {
      return date;
    }
  }, [period]);

  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-900">Statistics</h3>
          <TimeSelector period={period} setPeriod={setPeriod} />
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {Object.entries(CHART_COLORS).map(([name, color]) => (
                  <linearGradient key={name} id={`color${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                axisLine={false} 
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false}
                tickFormatter={value => `₹${value.toLocaleString()}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
                labelFormatter={formatDate}
                formatter={(value, name) => [
                  ['revenue', 'expenses', 'profit'].includes(name.toLowerCase()) 
                    ? `₹${value.toLocaleString()}`
                    : value,
                  name
                ]}
              />
              {CHART_SERIES.map(([key, name, color, axis]) => (
                <Area
                  key={key}
                  yAxisId={axis}
                  type="monotone"
                  dataKey={key}
                  name={name}
                  stroke={color}
                  fill={`url(#color${key})`}
                  fillOpacity={1}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardCharts);


