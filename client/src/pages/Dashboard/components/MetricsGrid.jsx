import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { 
  CurrencyRupeeIcon, ScaleIcon, BanknotesIcon, 
  UserGroupIcon, BeakerIcon, ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';
import useTrends from '../hooks/useTrends';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';

const MetricsGrid = ({ metrics, tokens, expenses, entries, exchanges, cashAdjustments, sparklineData, selectedPeriod }) => {
  usePerformanceMonitor('MetricsGrid');

  // Calculate total revenue separately
  const totalRevenue = useMemo(() => {
    return (tokens || []).reduce((sum, token) => sum + (parseFloat(token.totalAmount) || 0), 0);
  }, [tokens]);

  // Calculate total expenses separately
  const totalExpenses = useMemo(() => {
    return (expenses || []).reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
  }, [expenses]);

  // Calculate cash adjustments separately
  const adjustments = useMemo(() => {
    return (cashAdjustments || []).reduce((result, adj) => {
      const amount = parseFloat(adj?.amount) || 0;
      const adjustmentType = adj?.adjustment_type?.toLowerCase(); // 'addition' or 'deduction'
      
      if (adjustmentType === 'addition') {
        result.credit += amount;
      } else if (adjustmentType === 'deduction') {
        result.debit += amount;
      } else {
        // Fallback for any unexpected adjustment types
        result.debit += amount;
      }
      return result;
    }, { credit: 0, debit: 0 });
  }, [cashAdjustments]);

  // Calculate adjusted totals
  const adjustedRevenue = useMemo(() => {
    return totalRevenue + adjustments.credit;
  }, [totalRevenue, adjustments.credit]);

  const adjustedExpenses = useMemo(() => {
    return totalExpenses + adjustments.debit;
  }, [totalExpenses, adjustments.debit]);

  // Calculate final financial metrics
  const netProfit = useMemo(() => {
    return adjustedRevenue - adjustedExpenses;
  }, [adjustedRevenue, adjustedExpenses]);

  const profitMargin = useMemo(() => {
    return adjustedRevenue > 0 ? ((netProfit / adjustedRevenue) * 100).toFixed(2) : 0;
  }, [adjustedRevenue, netProfit]);

  const calculations = useMemo(() => {
    return {
      totalRevenue: adjustedRevenue,
      totalExpenses: adjustedExpenses,
      netProfit,
      profitMargin
    };
  }, [adjustedRevenue, adjustedExpenses, netProfit, profitMargin]);

  const trends = useTrends({ 
    tokens: tokens || [], 
    expenses: expenses || [], 
    entries: entries || [], 
    exchanges: exchanges || [] 
  });

  // Provide default metrics if none provided
  const safeMetrics = metrics || {
    totalCustomers: 0,
    totalTokens: 0,
    skinTestCount: 0,
    photoTestCount: 0,
    totalExchanges: 0,
    totalWeight: 0,
    totalExWeight: 0
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard 
        title="Total Revenue" 
        value={`₹${calculations.totalRevenue.toLocaleString()}`}
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
        value={`₹${calculations.totalExpenses.toLocaleString()}`}
        trend={trends.expensesGrowth || 0}
        icon={ScaleIcon}
        description="Total expenses this month"
        sparklineData={sparklineData?.expenses}
        sparklineColor="#EF4444" // Red color for expenses
        className="bg-white"
        iconClassName="text-red-500"
        valueClassName="text-red-600 font-bold"
        titleClassName="text-red-700"
      />
      <DashboardCard 
        title="Net Profit" 
        value={`₹${calculations.netProfit.toLocaleString()}`}
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
        value={`${calculations.profitMargin}%`}
        trend={trends.marginGrowth || 0}
        icon={UserGroupIcon}
        description="Current profit margin"
        className="bg-white"
        iconClassName="text-purple-500"
        valueClassName="text-purple-600 font-bold"
        titleClassName="text-purple-700"
      />
      <DashboardCard  
        title="Customers" 
        value={safeMetrics.totalCustomers.toString()}
        trend={trends.customersTrend || 0}
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
        description="Test-wise token breakdown"
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
              
              <span className="text-lg font-bold">
                {Number(safeMetrics.totalWeight || 0).toFixed(3)} g
              </span>
            </div>
            <div className="flex justify-between items-center">
            
              <span className="text-lg font-bold">
                {Number(safeMetrics.totalExWeight || 0).toFixed(3)} g
              </span>
            </div>
          </div>
        }
        trend={trends.weightTrend || 0}
        icon={ArrowsRightLeftIcon}
        description={`${selectedPeriod || 'Monthly'} exchange weights`}
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