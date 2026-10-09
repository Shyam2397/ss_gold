import React from 'react';
import DashboardCard from './DashboardCard';
import { 
  CurrencyRupeeIcon, ScaleIcon, BanknotesIcon, 
  UserGroupIcon, BeakerIcon, ArrowsRightLeftIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/solid';
import useTrends from '../hooks/useTrends';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';

const PERIOD_LABELS = {
  daily: 'Today',
  weekly: 'This week',
  monthly: 'This month',
  yearly: 'This year'
};

const MetricsGrid = ({ metrics, tokens, expenses, exchanges, sparklineData, selectedPeriod }) => {
  usePerformanceMonitor('MetricsGrid');

  const trends = useTrends({ 
    tokens: tokens || [], 
    expenses: expenses || [], 
    exchanges: exchanges || [] 
  });

  const periodLabel = PERIOD_LABELS[selectedPeriod] || 'Total';

  // Provide default metrics if none provided
  const safeMetrics = metrics || {
    totalCustomers: 0,
    totalTokens: 0,
    skinTestCount: 0,
    photoTestCount: 0,
    totalExchanges: 0,
    totalWeight: 0,
    totalExWeight: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard 
        title="Total Revenue" 
        value={`₹${Number(safeMetrics.totalRevenue || 0).toLocaleString()}`}
        trend={trends.revenueGrowth || 0}
        icon={CurrencyRupeeIcon}
        description="Total revenue from tokens"
        sparklineData={sparklineData?.revenue}
        sparklineColor="#10B981" // Green color for revenue
        className="bg-white"
        iconClassName="text-blue-500"
        valueClassName="text-blue-600 font-bold"
        titleClassName="text-blue-700"
      />
      <DashboardCard 
        title="Total Expenses" 
        value={`₹${Number(safeMetrics.totalExpenses || 0).toLocaleString()}`}
        trend={trends.expensesGrowth || 0}
        icon={ScaleIcon}
        description="Total expenses"
        sparklineData={sparklineData?.expenses}
        sparklineColor="#EF4444" // Red color for expenses
        className="bg-white"
        iconClassName="text-red-500"
        valueClassName="text-red-600 font-bold"
        titleClassName="text-red-700"
      />
      <DashboardCard 
        title="Net Profit" 
        value={`₹${Number(safeMetrics.netProfit || 0).toLocaleString()}`}
        trend={trends.profitGrowth || 0}
        icon={BanknotesIcon}
        description="Net profit after expenses"
        sparklineData={sparklineData?.profit}
        sparklineColor="#10B981" // Green color for profit
        className="bg-white"
        iconClassName="text-green-500"
        valueClassName="text-green-600 font-bold"
        titleClassName="text-green-700"
      />  
      <DashboardCard 
        title="Profit Margin" 
        value={`${Number(safeMetrics.profitMargin || 0).toFixed(2)}%`}
        trend={trends.marginGrowth || 0}
        icon={ArrowTrendingUpIcon}
        description="Current profit margin"
        className="bg-white"
        iconClassName="text-purple-500"
        valueClassName="text-purple-600 font-bold"
        titleClassName="text-purple-700"
      />
      <DashboardCard  
        title="Customers" 
        value={safeMetrics.totalCustomers.toString()}
        icon={UserGroupIcon}
        description="Total number of customers"
        className="bg-white"
        iconClassName="text-indigo-500"
        valueClassName="text-indigo-600 font-bold"
        titleClassName="text-indigo-700"
      />
      <DashboardCard 
        title="Token" 
        value={
          <div className="flex flex-col space-y-1">
            <div className="font-bold text-yellow-900">{safeMetrics.totalTokens}</div>
            <div className="flex flex-row items-center text-sm">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                <span className="ml-1 font-semibold">{safeMetrics.skinTestCount}</span>
              </div>
              <div className="flex items-center ml-5">
                <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                <span className="ml-1 font-semibold">{safeMetrics.photoTestCount}</span>
              </div>
            </div>
          </div>
        }
        trend={trends.tokensTrend || 0}
        icon={BeakerIcon}
        description="Total test-wise tokens"
        sparklineData={sparklineData?.tokens}
        sparklineColor="#10B981" // Green color for tokens
        className="bg-white"
        iconClassName="text-amber-500"
        valueClassName="text-amber-600 font-bold"
        titleClassName="text-amber-700"
      />
      <DashboardCard 
        title="Total Exchange" 
        value={safeMetrics.totalExchanges.toString()}
        trend={trends.exchangesTrend || 0}
        icon={ScaleIcon}
        description="Total number of exchanges"
        sparklineData={sparklineData?.exchanges}
        sparklineColor="#10B981" // Green color for exchanges
        className="bg-white"
        iconClassName="text-pink-500"
        valueClassName="text-pink-600 font-bold"
        titleClassName="text-pink-700"
      />
      <DashboardCard 
        title="Pure Exchange" 
        value={
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Impure</span>
              <span className="text-lg font-bold">
                {Number(safeMetrics.totalWeight || 0).toFixed(3)} g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Pure</span>
              <span className="text-lg font-bold">
                {Number(safeMetrics.totalExWeight || 0).toFixed(3)} g
              </span>
            </div>
          </div>
        }
        trend={trends.weightTrend || 0}
        icon={ArrowsRightLeftIcon}
        description={`Impure/Pure weights for ${periodLabel.toLowerCase()}`}
        sparklineData={sparklineData?.weights}
        className="bg-white"
        sparklineColor="#10B981" // Green color for weights
        iconClassName="text-emerald-500"
        valueClassName="text-emerald-600 font-bold"
        titleClassName="text-emerald-700"
      />
    </div>
  );
};

export default React.memo(MetricsGrid);
