import React from 'react';
import DashboardCard from './DashboardCard';
import { 
  CurrencyRupeeIcon, ScaleIcon, ReceiptPercentIcon, 
  UserGroupIcon, BeakerIcon, ArrowsRightLeftIcon 
} from '@heroicons/react/24/solid';
import useTrends from '../hooks/useTrends';

const MetricsGrid = ({ metrics, tokens, expenses, entries, exchanges, sparklineData }) => {
  const totalRevenue = tokens.reduce((sum, token) => sum + (parseFloat(token.totalAmount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

  const trends = useTrends({ tokens, expenses, entries, exchanges });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard 
        title="Total Revenue" 
        value={`₹${totalRevenue.toLocaleString()}`}
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
        value={`₹${totalExpenses.toLocaleString()}`}
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
        value={`₹${netProfit.toLocaleString()}`}
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
        value={`${profitMargin}%`}
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
          <div className="flex flex-col justify-between w-full text-xl">
            <span>{(metrics.totalWeight || 0).toFixed(3)} g</span>
            <span>{(metrics.totalExWeight || 0).toFixed(3)} g</span>
          </div>
        }
        trend={trends.weightTrend}
        icon={ArrowsRightLeftIcon}
        description="Exchange weights breakdown"
        sparklineData={sparklineData.weights}
        className="bg-white"
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-900"
      />
    </div>
  );
};

export default MetricsGrid;