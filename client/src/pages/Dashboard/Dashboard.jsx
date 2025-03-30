import React, { Suspense, lazy, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useDashboardData from './components/useDashboardData';
import useSparklineData from './hooks/useSparklineData';
import DashboardHeader from './components/DashboardHeader';
import MetricsGrid from './components/MetricsGrid';
import RecentActivity from './components/RecentActivity';
import UnpaidCustomers from './components/UnpaidCustomers';
import ErrorBoundary from './ErrorBoundary';
import usePerformanceMonitor from './hooks/usePerformanceMonitor';

// Lazy load heavy components
const DashboardCharts = lazy(() => import('./components/DashboardCharts'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function DashboardContent() {
  usePerformanceMonitor('Dashboard');

  const {
    tokens, entries, expenses, exchanges, loading, error, recentActivities,
    todayTotal, dateRange, setDateRange, metrics, selectedPeriod
  } = useDashboardData();

  const sparklineData = useSparklineData({ tokens, expenseData: expenses, entries, exchanges });

  // Add data prefetching
  useEffect(() => {
    const prefetchData = async () => {
      // Prefetch next day's data
    };
    prefetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="h-32 w-32 border-4 border-yellow-500 rounded-full border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
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
        <DashboardHeader todayTotal={todayTotal} dateRange={dateRange} onDateRangeChange={setDateRange} />
        <MetricsGrid 
          metrics={metrics} 
          tokens={tokens} 
          expenses={expenses} 
          entries={entries} 
          exchanges={exchanges} 
          sparklineData={sparklineData} 
          selectedPeriod={selectedPeriod}
        />
        <ErrorBoundary>
          <Suspense fallback={<div>Loading charts...</div>}>
            <DashboardCharts 
              tokens={tokens} 
              expenses={expenses} 
              entries={entries} 
              exchanges={exchanges} 
            />
          </Suspense>
        </ErrorBoundary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentActivity activities={recentActivities} loading={loading} />
          <UnpaidCustomers tokens={tokens} loading={loading} />
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}

function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Dashboard;