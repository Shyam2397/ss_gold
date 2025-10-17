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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm h-24">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm h-96">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-full bg-gray-100 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm h-80">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm h-80">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="p-6 text-red-500 bg-red-50 rounded-lg border border-red-200 max-w-3xl mx-auto mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 h-6 w-6 text-red-400" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium ml-2">Error Loading Dashboard</h3>
        </div>
        <p className="mb-4">There was an error loading the dashboard data. Please try again later.</p>
        <div className="text-sm bg-white p-3 rounded border border-red-100">
          <p className="font-mono">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
        >
          Reload Page
        </button>
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
            cashAdjustments={cashAdjustments || []}
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