import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

// Trend Sparkline Component
const TrendSparkline = ({ data, color }) => (
  <div className="h-6 w-20">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          dot={false}
          strokeLinecap="round"
          animationDuration={500}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const DashboardCard = ({ title, value, trend, icon: Icon, description, sparklineData, className, iconClassName, valueClassName }) => {
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
            <h3 className="text-gray-600 text-base sm:text-xl font-medium truncate">{title}</h3>
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
            {sparklineData && <TrendSparkline data={sparklineData} color={trendColor} />}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Memoization comparison function with better performance
const areEqual = (prevProps, nextProps) => {
  // Shallow comparison for primitive values
  if (
    prevProps.title !== nextProps.title ||
    prevProps.value !== nextProps.value ||
    prevProps.trend !== nextProps.trend ||
    prevProps.icon !== nextProps.icon ||
    prevProps.description !== nextProps.description ||
    prevProps.className !== nextProps.className ||
    prevProps.iconClassName !== nextProps.iconClassName ||
    prevProps.valueClassName !== nextProps.valueClassName
  ) {
    return false;
  }
  
  // Deep comparison for sparkline data only if needed
  if (prevProps.sparklineData !== nextProps.sparklineData) {
    // Only compare if both are arrays
    if (Array.isArray(prevProps.sparklineData) && Array.isArray(nextProps.sparklineData)) {
      // Compare length first for quick rejection
      if (prevProps.sparklineData.length !== nextProps.sparklineData.length) {
        return false;
      }
      
      // Compare only first and last elements for performance
      if (prevProps.sparklineData.length > 0) {
        const prevFirst = prevProps.sparklineData[0];
        const prevLast = prevProps.sparklineData[prevProps.sparklineData.length - 1];
        const nextFirst = nextProps.sparklineData[0];
        const nextLast = nextProps.sparklineData[nextProps.sparklineData.length - 1];
        
        if (
          prevFirst?.value !== nextFirst?.value ||
          prevLast?.value !== nextLast?.value
        ) {
          return false;
        }
      }
    } else {
      // One is array and other is not
      return false;
    }
  }
  
  return true;
};

export default React.memo(DashboardCard, areEqual);