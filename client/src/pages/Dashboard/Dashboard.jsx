import React, { Suspense, lazy, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoadingSpinner } from './components/LoadingSkeleton';
import { useDashboardData } from './components/useDashboardData';
import useSparklineData from './hooks/useSparklineData';
import ErrorBoundary from './ErrorBoundary';
import usePerformanceMonitor from './hooks/usePerformanceMonitor';
import { actionTypes } from './reducers/dashboardReducer';

// Lazy load components
const DashboardHeader = lazy(() => import('./components/DashboardHeader'));
const MetricsGrid = lazy(() => import('./components/MetricsGrid'));
const DashboardCharts = lazy(() => import('./components/DashboardCharts'));
const RecentActivity = lazy(() => import('./components/RecentActivity'));
const UnpaidCustomers = lazy(() => import('./components/UnpaidCustomers'));

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
  const dashboardData = useDashboardData();
  const {
    tokens, entries, expenses, exchanges, loading, error, recentActivities,
    todayTotal, dateRange, metrics, selectedPeriod
  } = dashboardData;

  const sparklineData = useSparklineData({ tokens, expenseData: expenses, entries, exchanges });

  // Add data prefetching
  useEffect(() => {
    const prefetchData = async () => {
      // Prefetch next day's data
    };
    prefetchData();
  }, [dateRange]);

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
          <DashboardHeader 
            todayTotal={todayTotal} 
            dateRange={dateRange} 
            onDateRangeChange={(range) => dashboardData.dispatch({ 
              type: actionTypes.SET_DATE_RANGE, 
              payload: range 
            })} 
          />
        </Suspense>
        
        <Suspense fallback={<LoadingSpinner />}>
          <MetricsGrid 
            metrics={metrics} 
            tokens={tokens} 
            expenses={expenses} 
            entries={entries} 
            exchanges={exchanges} 
            sparklineData={sparklineData} 
            selectedPeriod={selectedPeriod}
          />
        </Suspense>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardCharts 
              tokens={tokens} 
              expenses={expenses} 
              entries={entries} 
              exchanges={exchanges} 
            />
          </Suspense>
        </ErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<LoadingSpinner />}>
            <RecentActivity activities={recentActivities} loading={loading} />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <UnpaidCustomers tokens={tokens} loading={loading} />
          </Suspense>
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