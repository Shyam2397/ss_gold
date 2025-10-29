import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Area } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

// Trend Sparkline Component with error handling and debugging
const TrendSparkline = ({ data, color }) => {
  // Data validation
  React.useEffect(() => {
    // Data validation logic can go here without console logs
  }, [data]);

  // Handle empty or invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-6 w-20 flex items-center justify-center">
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Ensure all data points have a value
  const validData = data.map(item => ({
    ...item,
    value: typeof item.value === 'number' ? item.value : 0
  }));

  // Calculate min and max for scaling
  const values = validData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // If all values are the same, add a small range for visibility
  if (minValue === maxValue) {
    validData.forEach((item, i) => {
      item.value = i % 2 === 0 ? item.value + 0.1 : item.value - 0.1;
    });
  }

  return (
    <div className="h-6 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={validData} 
          margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
        >
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            strokeLinecap="round"
            strokeLinejoin="round"
            animationDuration={500}
            isAnimationActive={true}
            activeDot={{ r: 3, fill: color }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            fill="url(#sparklineGradient)" 
            stroke="none"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DashboardCard = ({ title, value, trend, icon: Icon, description, sparklineData, sparklineColor, className, iconClassName, valueClassName, titleClassName = 'text-gray-900' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = trend > 0;
  const trendColor = isPositive ? '#10B981' : '#EF4444';
  const trendBgColor = isPositive ? 'bg-emerald-50' : 'bg-red-50';
  const trendTextColor = isPositive ? 'text-emerald-600' : 'text-red-600';

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
            <h3 className={`text-base sm:text-xl font-medium truncate ${titleClassName}`}>{title}</h3>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center px-2 py-0.5 rounded-full ${trendBgColor}`}>
            {isPositive ? 
              <ArrowUpIcon className={`w-3 h-3 ${trendTextColor}`} /> : 
              <ArrowDownIcon className={`w-3 h-3 ${trendTextColor}`} />
            }
            <span className={`ml-1 text-xs ${trendTextColor}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between w-full">
            <div className={`text-xl sm:text-2xl font-bold ${valueClassName}`}>{value}</div>
            {sparklineData && <TrendSparkline data={sparklineData} color={sparklineColor || trendColor} />}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Memoization comparison function
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.trend === nextProps.trend &&
    prevProps.icon === nextProps.icon &&
    prevProps.description === nextProps.description &&
    prevProps.className === nextProps.className &&
    prevProps.iconClassName === nextProps.iconClassName &&
    prevProps.valueClassName === nextProps.valueClassName &&
    JSON.stringify(prevProps.sparklineData) === JSON.stringify(nextProps.sparklineData)
  );
};

export default React.memo(DashboardCard, areEqual);