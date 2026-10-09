import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { LoadingSpinner } from './components/LoadingSkeleton';
import { useDashboardData } from './components/useDashboardData';
import useSparklineData from './hooks/useSparklineData';
import ErrorBoundary from './ErrorBoundary';
import usePerformanceMonitor from './hooks/usePerformanceMonitor';
import TimeSelector from './components/TimeSelector';

// Lazy load components
const DashboardHeader = lazy(() => import('./components/DashboardHeader'));
const MetricsGrid = lazy(() => import('./components/MetricsGrid'));
const DashboardCharts = lazy(() => import('./components/DashboardCharts'));
const RecentActivity = lazy(() => import('./components/RecentActivity'));
const UnpaidCustomers = lazy(() => import('./components/UnpaidCustomers'));

function DashboardContent() {
  usePerformanceMonitor('Dashboard');

  const {
    tokens, entries, expenses, exchanges, loading, error,
    recentActivities, todayTotal, metrics, selectedPeriod, setSelectedPeriod
  } = useDashboardData();

  const sparklineData = useSparklineData({
    tokens: tokens || [],
    expenseData: expenses || [],
    entries: entries || [],
    exchanges: exchanges || []
  });

  // Provide safe defaults for optional data
  const safeTokens = tokens || [];
  const safeExpenses = expenses || [];
  const safeEntries = entries || [];
  const safeExchanges = exchanges || [];
  const safeRecentActivities = recentActivities || [];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <motion.div className="p-6 text-red-500">
        Error loading dashboard: {error}
      </motion.div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <Toaster />
        <Suspense fallback={<LoadingSpinner />}>
          <>
            <DashboardHeader todayTotal={todayTotal} />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-yellow-900">Overview</h2>
              <TimeSelector period={selectedPeriod} setPeriod={setSelectedPeriod} />
            </div>

            <MetricsGrid
              metrics={metrics}
              tokens={safeTokens}
              expenses={safeExpenses}
              exchanges={safeExchanges}
              sparklineData={sparklineData}
              selectedPeriod={selectedPeriod}
            />

            <ErrorBoundary>
              <DashboardCharts
                tokens={safeTokens}
                expenses={safeExpenses}
                entries={safeEntries}
                exchanges={safeExchanges}
              />
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity activities={safeRecentActivities} loading={loading} />
              <UnpaidCustomers tokens={safeTokens} loading={loading} />
            </div>
          </>
        </Suspense>
      </motion.div>
    </ErrorBoundary>
  );
}

function Dashboard() {
  return <DashboardContent />;
}

export default Dashboard;
