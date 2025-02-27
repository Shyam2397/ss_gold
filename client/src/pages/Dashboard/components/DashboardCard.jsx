import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

// Trend Sparkline Component
const TrendSparkline = ({ data, color }) => (
  <div className="h-6 w-20">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const DashboardCard = ({ title, value, trend, icon: Icon, description, sparklineData, className, iconClassName, valueClassName }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = trend > 0;
  const trendColor = isPositive ? '#F7DC6F' : '#EF4444';

  return (
    <motion.div
      className={`bg-white rounded-3xl shadow-sm hover:shadow relative overflow-hidden min-h-[120px] ${className}`}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-50" />
      <div className="p-4 relative">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          {/* Title and Icon */}
          <div className="flex items-center space-x-2">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-yellow-50">
                <Icon className={`w-5 h-5 ${iconClassName}`} />
              </div>
            )}
            <h3 className="text-gray-600 text-base sm:text-xl font-medium truncate">{title}</h3>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center px-2 py-0.5 rounded-full ${isPositive ? 'bg-yellow-50' : 'bg-red-50'}`}>
            {isPositive ? 
              <ArrowUpIcon className="w-3 h-3 text-yellow-600" /> : 
              <ArrowDownIcon className="w-3 h-3 text-red-500" />
            }
            <span className={`ml-1 text-xs ${isPositive ? 'text-yellow-600' : 'text-red-600'}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className={`text-xl sm:text-2xl font-bold ${valueClassName}`}>{value}</div>
            {sparklineData && <TrendSparkline data={sparklineData} color={trendColor} />}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardCard;