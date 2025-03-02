import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardCharts = ({ sparklineData }) => {
  const [period, setPeriod] = useState('daily');

  const aggregateData = (data, period) => {
    if (!data || !data.length) return [];

    switch (period) {
      case 'weekly':
        return data.reduce((acc, curr) => {
          const date = new Date(curr.date);
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          const weekKey = weekStart.toISOString().split('T')[0];
          const existingWeek = acc.find(item => item.date === weekKey);
          
          if (existingWeek) {
            existingWeek.value += curr.value;
          } else {
            acc.push({ date: weekKey, value: curr.value });
          }
          return acc;
        }, []);

      case 'monthly':
        return data.reduce((acc, curr) => {
          const date = new Date(curr.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const existingMonth = acc.find(item => item.date === monthKey);
          
          if (existingMonth) {
            existingMonth.value += curr.value;
          } else {
            acc.push({ date: monthKey, value: curr.value });
          }
          return acc;
        }, []);

      case 'yearly':
        return data.reduce((acc, curr) => {
          const date = new Date(curr.date);
          const yearKey = date.getFullYear().toString();
          const existingYear = acc.find(item => item.date === yearKey);
          
          if (existingYear) {
            existingYear.value += curr.value;
          } else {
            acc.push({ date: yearKey, value: curr.value });
          }
          return acc;
        }, []);

      default: // daily
        return data;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-900">Statistics</h3>
          <div className="flex space-x-2">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm ${period === p ? 'bg-yellow-100 text-yellow-900' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer>
            <AreaChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {[
                  { id: 'colorRevenue', color: '#F7DC6F' },
                  { id: 'colorExpenses', color: '#EF4444' },
                  { id: 'colorProfit', color: '#10B981' },
                  { id: 'colorMargin', color: '#6366F1' },
                  { id: 'colorCustomers', color: '#F59E0B' }
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => {
                  switch (period) {
                    case 'weekly':
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    case 'monthly':
                      return value.split('-')[1] + '/' + value.split('-')[0];
                    case 'yearly':
                      return value;
                    default:
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                }}
              />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
                labelFormatter={(value) => {
                  switch (period) {
                    case 'weekly':
                      return `Week of ${new Date(value).toLocaleDateString()}`;
                    case 'monthly':
                      return `${new Date(value + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
                    case 'yearly':
                      return `Year ${value}`;
                    default:
                      return new Date(value).toLocaleDateString();
                  }
                }}
              />
              <Area
                type="monotone"
                data={aggregateData(sparklineData.revenue, period)}
                dataKey="value"
                name="Revenue"
                stroke="#F7DC6F"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={aggregateData(sparklineData.expenses, period)}
                dataKey="value"
                name="Expenses"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={aggregateData(sparklineData.profit, period)}
                dataKey="value"
                name="Profit"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorProfit)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={aggregateData(sparklineData.margin, period)}
                dataKey="value"
                name="Margin"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorMargin)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={aggregateData(sparklineData.customers, period)}
                dataKey="value"
                name="Customers"
                stroke="#F59E0B"
                fillOpacity={1}
                fill="url(#colorCustomers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;


