import React from 'react';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiDollarSign,
  FiHash,
  FiPercent,
  FiRepeat,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { LoadingSpinner } from './components/LoadingSkeleton';
import ErrorBoundary from './ErrorBoundary';
import { useDashboardOverview } from './hooks/useDashboardOverview';
import { useGoldRate } from './hooks/useGoldRate';
import KpiCard from './components/KpiCard';
import GoldRateCard from './components/GoldRateCard';
import DashboardCharts from './components/DashboardCharts';
import PurityDistributionChart from './components/PurityDistributionChart';
import QuickActions from './components/QuickActions';
import RecentSamplesTable from './components/RecentSamplesTable';
import SystemStatusBar from './components/SystemStatusBar';

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const Dashboard = () => {
  const {
    loading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    lastUpdated,
    kpis,
    finance,
    purity,
    recentSamples,
    tokens,
    expenses,
    exchanges,
  } = useDashboardOverview();

  const goldRate = useGoldRate();

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6"
      >
        {error && (
          <div className="rounded-xl border border-branddanger/30 bg-branddanger/5 px-4 py-3 text-sm text-branddanger">
            Some dashboard data could not be loaded: {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <KpiCard
            icon={FiDollarSign}
            label="Total Revenue"
            value={formatCurrency(finance.totalRevenue)}
            hint="Tokens + additions"
            tone="gold"
          />
          <KpiCard
            icon={FiTrendingDown}
            label="Total Expenses"
            value={formatCurrency(finance.totalExpenses)}
            hint="Expenses + deductions"
            tone="red"
          />
          <KpiCard
            icon={FiTrendingUp}
            label="Net Profit"
            value={formatCurrency(finance.netProfit)}
            hint="Revenue − expenses"
            tone="green"
          />
          <KpiCard
            icon={FiPercent}
            label="Profit Margin"
            value={`${Number(finance.profitMargin || 0).toFixed(1)}%`}
            hint="Net profit / revenue"
            tone="violet"
          />
          <KpiCard
            icon={FiUsers}
            label="Total Customers"
            value={kpis.totalCustomers}
            hint={`${kpis.customersThisWeek} new this week`}
            tone="blue"
          />
          <KpiCard
            icon={FiHash}
            label="Token"
            value={finance.totalTokens}
            hint={`${finance.skinTestCount} skin · ${finance.photoTestCount} photo`}
            tone="amber"
          />
          <KpiCard
            icon={FiRepeat}
            label="Total Exchange"
            value={finance.totalExchanges}
            hint="All-time exchanges"
            tone="sky"
          />
          <KpiCard
            icon={FiActivity}
            label="Pure Exchange"
            value={`${finance.pureWeight.toFixed(2)} g`}
            hint={`Impure ${finance.impureWeight.toFixed(2)} g`}
            tone="teal"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardCharts
              tokens={tokens}
              expenses={expenses}
              exchanges={exchanges}
              period={selectedPeriod}
              setPeriod={setSelectedPeriod}
            />
          </div>
          <QuickActions
            corner={
              <GoldRateCard
                rate24k={goldRate.rate24k}
                rate22k={goldRate.rate22k}
                rate18k={goldRate.rate18k}
                updatedAt={goldRate.updatedAt}
                hasRate={goldRate.hasRate}
                onSave={goldRate.save}
              />
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <PurityDistributionChart purity={purity} />
          <div className="xl:col-span-2">
            <RecentSamplesTable samples={recentSamples} />
          </div>
        </div>

        <SystemStatusBar
          error={error}
          lastUpdated={lastUpdated}
          samplesToday={kpis.samplesToday}
          hasGoldRate={goldRate.hasRate}
        />
      </motion.div>
    </ErrorBoundary>
  );
};

export default Dashboard;
