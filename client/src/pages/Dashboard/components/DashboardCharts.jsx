import React, { useState, useMemo } from 'react';
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

const DashboardCharts = ({ tokens = [], expenses = [], entries = [], exchanges = [] }) => {
  const [period, setPeriod] = useState('daily');
  
  const chartData = useMemo(() => {
    try {
      const today = new Date();
      let startDate = new Date();
      
      // Set time range
      switch (period) {
        case 'yearly':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 11);
          break;
        case 'weekly':
          startDate.setDate(today.getDate() - 7);
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      // Generate data points
      return Array.from(
        { length: Math.ceil((today - startDate) / (24 * 60 * 60 * 1000)) + 1 },
        (_, index) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + index);
          const dateStr = currentDate.toISOString().split('T')[0];

          // Get day's data
          const dayTokens = tokens.filter(token => 
            new Date(token.date).toISOString().split('T')[0] === dateStr);
          const dayExpenses = expenses.filter(expense => 
            new Date(expense.date).toISOString().split('T')[0] === dateStr);
          const dayExchanges = exchanges.filter(exchange => 
            new Date(exchange.date.split('-').reverse().join('-')).toISOString().split('T')[0] === dateStr);

          // Calculate metrics
          const revenue = dayTokens.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
          const expenseTotal = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
          
          return {
            date: dateStr,
            revenue,
            expenses: expenseTotal,
            profit: revenue - expenseTotal,
            tokens: dayTokens.length,
            exchanges: dayExchanges.length,
            weight: dayExchanges.reduce((sum, ex) => sum + (parseFloat(ex.weight) || 0), 0)
          };
        }
      );
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [tokens, expenses, exchanges, period]);

  const formatDate = (date) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      
      switch (period) {
        case 'yearly':
          return d.getFullYear();
        case 'monthly':
          return d.toLocaleString('default', { month: 'short', year: 'numeric' });
        default:
          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
    }
  };

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

export default DashboardCharts;


