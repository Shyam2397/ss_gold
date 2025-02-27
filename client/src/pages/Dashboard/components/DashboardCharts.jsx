import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardCharts = ({ sparklineData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Revenue vs Expenses Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Revenue vs Expenses</h3>
        <div className="h-[300px]">
          <ResponsiveContainer>
            <LineChart data={sparklineData.revenue}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="totalAmount" name="Revenue" stroke="#F7DC6F" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Trend Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Profit Trend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer>
            <AreaChart data={sparklineData.profit}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="totalAmount" name="Profit" fill="#F7DC6F" stroke="#F2C464" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;