import React, { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { 
  CurrencyRupeeIcon, ScaleIcon, ReceiptPercentIcon, 
  UserGroupIcon, BeakerIcon, ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';
import useTrends from '../hooks/useTrends';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';

const MetricsGrid = ({ metrics, tokens, expenses, entries, exchanges, cashAdjustments, sparklineData, selectedPeriod }) => {
  usePerformanceMonitor('MetricsGrid');

  const calculations = useMemo(() => {
    // Calculate base revenue and expenses
    const totalRevenue = tokens.reduce((sum, token) => sum + (parseFloat(token.totalAmount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
    
    const adjustments = (cashAdjustments || []).reduce((result, adj) => {
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
    
    // Calculate adjusted totals
    // Credits increase revenue, debits increase expenses
    const adjustedRevenue = totalRevenue + adjustments.credit;
    const adjustedExpenses = totalExpenses + adjustments.debit;
    
    const netProfit = adjustedRevenue - adjustedExpenses;
    const profitMargin = adjustedRevenue > 0 ? ((netProfit / adjustedRevenue) * 100).toFixed(2) : 0;

    return {
      totalRevenue: adjustedRevenue,
      totalExpenses: adjustedExpenses,
      netProfit,
      profitMargin
    };
  }, [tokens, expenses, cashAdjustments]);

  const trends = useTrends({ tokens, expenses, entries, exchanges });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard 
        title="Total Revenue" 
        value={`₹${calculations.totalRevenue.toLocaleString()}`}
        trend={trends.revenueGrowth}
        icon={CurrencyRupeeIcon}
        description="Total revenue from tokens"
        sparklineData={sparklineData.revenue}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Total Expenses" 
        value={`₹${calculations.totalExpenses.toLocaleString()}`}
        trend={trends.expensesGrowth}
        icon={ScaleIcon}
        description="Total expenses this month"
        sparklineData={sparklineData.expenses}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Net Profit" 
        value={`₹${calculations.netProfit.toLocaleString()}`}
        trend={trends.profitGrowth}
        icon={ReceiptPercentIcon}
        description="Net profit this month"
        sparklineData={sparklineData.profit}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Profit Margin" 
        value={`${calculations.profitMargin}%`}
        trend={trends.marginGrowth}
        icon={UserGroupIcon}
        description="Current profit margin"
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Customers" 
        value={metrics.totalCustomers.toString()}
        trend={trends.customersTrend}
        icon={UserGroupIcon}
        description="Total number of customers"
        sparklineData={sparklineData.customers}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Token" 
        value={
          <div className="flex flex-col space-y-1">
            <div className="text-lg font-bold text-yellow-900">Total: {metrics.totalTokens}</div>
            <div className="flex flex-row items-center text-sm">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                <span className="ml-1 font-semibold">{metrics.skinTestCount}</span>
              </div>
              <div className="flex items-center ml-5">
                <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                <span className="ml-1 font-semibold">{metrics.photoTestCount}</span>
              </div>
            </div>
          </div>
        }
        trend={trends.tokensTrend}
        icon={BeakerIcon}
        description="Test-wise token breakdown"
        sparklineData={sparklineData.skinTests}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Total Exchange" 
        value={metrics.totalExchanges.toString()}
        trend={trends.exchangesTrend}
        icon={ScaleIcon}
        description="Total number of exchanges"
        sparklineData={sparklineData.weights}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
      <DashboardCard 
        title="Pure Exchange" 
        value={
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex justify-between items-center">
              
              <span className="text-lg font-bold">
                {Number(metrics.totalWeight || 0).toFixed(3)} g
              </span>
            </div>
            <div className="flex justify-between items-center">
            
              <span className="text-lg font-bold">
                {Number(metrics.totalExWeight || 0).toFixed(3)} g
              </span>
            </div>
          </div>
        }
        trend={trends.weightTrend}
        icon={ArrowsRightLeftIcon}
        description={`${selectedPeriod} exchange weights`}
        sparklineData={sparklineData.weights}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
    </div>
  );
};

export default React.memo(MetricsGrid);