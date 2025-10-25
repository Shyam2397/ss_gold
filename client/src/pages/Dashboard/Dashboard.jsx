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
    tokens, entries, expenses, exchanges, cashAdjustments, loading, error, recentActivities,
    todayTotal, dateRange, metrics, selectedPeriod
  } = dashboardData;

  const sparklineData = useSparklineData({ 
    tokens: tokens || [], 
    expenseData: expenses || [], 
    entries: entries || [], 
    exchanges: exchanges || [] 
  });

  // Add data prefetching
  useEffect(() => {
    const prefetchData = async () => {
      // Prefetch next day's data
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      try {
        // Prefetch common dashboard data queries
        await queryClient.prefetchQuery({
          queryKey: ['tokens', { date: tomorrow.toISOString().split('T')[0] }],
          queryFn: () => Promise.resolve([]), // In a real app, this would fetch actual data
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        
        await queryClient.prefetchQuery({
          queryKey: ['expenses', { date: tomorrow.toISOString().split('T')[0] }],
          queryFn: () => Promise.resolve([]),
          staleTime: 5 * 60 * 1000,
        });
      } catch (error) {
        console.warn('Prefetching failed:', error);
      }
    };
    
    // Use requestIdleCallback if available for non-blocking prefetching
    if ('requestIdleCallback' in window) {
      const timeoutId = requestIdleCallback(prefetchData, { timeout: 1000 });
      return () => cancelIdleCallback(timeoutId);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timeoutId = setTimeout(prefetchData, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [dateRange]);

  // Check for undefined data and provide defaults
  const safeTokens = tokens || [];
  const safeExpenses = expenses || [];
  const safeEntries = entries || [];
  const safeExchanges = exchanges || [];
  const safeCashAdjustments = cashAdjustments || [];
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
            tokens={safeTokens} 
            expenses={safeExpenses} 
            entries={safeEntries} 
            exchanges={safeExchanges}
            cashAdjustments={safeCashAdjustments}
            sparklineData={sparklineData} 
            selectedPeriod={selectedPeriod}
          />
        </Suspense>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardCharts 
              tokens={safeTokens} 
              expenses={safeExpenses} 
              entries={safeEntries} 
              exchanges={safeExchanges} 
            />
          </Suspense>
        </ErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<LoadingSpinner />}>
            <RecentActivity activities={safeRecentActivities} loading={loading} />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <UnpaidCustomers tokens={safeTokens} loading={loading} />
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