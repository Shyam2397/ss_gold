import React, { Suspense, lazy, useEffect, useCallback, useMemo } from 'react';
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

// Create a single QueryClient instance
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });
};

function DashboardContent({ queryClient }) {
  usePerformanceMonitor('Dashboard');
  const dashboardData = useDashboardData();
  const {
    tokens, entries, expenses, exchanges, cashAdjustments, loading, error, recentActivities,
    todayTotal, dateRange, metrics, selectedPeriod
  } = dashboardData;

  // Memoize the date range change handler at the top level
  const handleDateRangeChange = useCallback((range) => {
    dashboardData.dispatch({ 
      type: actionTypes.SET_DATE_RANGE, 
      payload: range 
    });
  }, [dashboardData]);

  const sparklineData = useSparklineData({ 
    tokens: tokens || [], 
    expenseData: expenses || [], 
    entries: entries || [], 
    exchanges: exchanges || [] 
  });

  // Optimized data prefetching with useCallback
  const prefetchData = useCallback(async () => {
    if (!queryClient) return;
    
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dateKey = tomorrow.toISOString().split('T')[0];
      
      // Check cache in parallel
      const [tokensCache, expensesCache] = await Promise.all([
        queryClient.getQueryData(['tokens', { date: dateKey }]),
        queryClient.getQueryData(['expenses', { date: dateKey }])
      ]);
      
      const prefetchPromises = [];
      
      if (!tokensCache) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['tokens', { date: dateKey }],
            queryFn: () => Promise.resolve([]),
            staleTime: 5 * 60 * 1000,
          })
        );
      }
      
      if (!expensesCache) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['expenses', { date: dateKey }],
            queryFn: () => Promise.resolve([]),
            staleTime: 5 * 60 * 1000,
          })
        );
      }
      
      if (prefetchPromises.length > 0) {
        await Promise.allSettled(prefetchPromises);
      }
    } catch (error) {
      console.warn('Prefetching failed:', error);
    }
  }, [queryClient]);

  // Setup prefetching with cleanup
  useEffect(() => {
    if (!queryClient) return;
    
    const schedulePrefetch = () => {
      if (window.requestIdleCallback) {
        return requestIdleCallback(prefetchData, { timeout: 1000 });
      }
      return setTimeout(prefetchData, 1000);
    };
    
    // Initial prefetch
    const timeoutId = schedulePrefetch();
    
    // Set up periodic prefetch (every 5 minutes)
    const intervalId = setInterval(schedulePrefetch, 5 * 60 * 1000);
    
    // Cleanup function
    return () => {
      if (window.cancelIdleCallback) {
        cancelIdleCallback(timeoutId);
      } else {
        clearTimeout(timeoutId);
      }
      clearInterval(intervalId);
    };
  }, [prefetchData, queryClient]);

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

  // Single Suspense boundary for better performance
  return (
    <ErrorBoundary>
      <motion.div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <Toaster />
        <Suspense fallback={<LoadingSpinner />}>
          <>
            <DashboardHeader 
              todayTotal={todayTotal} 
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange} 
            />
            
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
  // Initialize queryClient inside the component
  const queryClient = useMemo(() => createQueryClient(), []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent queryClient={queryClient} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Dashboard;