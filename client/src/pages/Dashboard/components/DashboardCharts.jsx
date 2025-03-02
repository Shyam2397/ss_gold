import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardCharts = ({ sparklineData }) => {
  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Statistics</h3>
        <div className="h-[400px]">
          <ResponsiveContainer>
            <AreaChart data={sparklineData.revenue} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }} 
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke="#F7DC6F"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={sparklineData.expenses}
                dataKey="value"
                name="Expenses"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={sparklineData.profit}
                dataKey="value"
                name="Profit"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorProfit)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={sparklineData.margin}
                dataKey="value"
                name="Margin"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorMargin)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                data={sparklineData.customers}
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


