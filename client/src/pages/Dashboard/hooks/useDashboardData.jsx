import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as dashboardService from '../services/dashboardService';

const useDashboardData = () => {
  // ...existing state code...

  const queries = useQueries({
    queries: [
      {
        queryKey: ['tokens'],
        queryFn: dashboardService.fetchTokens,
        staleTime: 300000, // 5 minutes
        refetchInterval: 300000,
      },
      {
        queryKey: ['expenses'],
        queryFn: dashboardService.fetchExpenses,
        staleTime: 300000,
      },
      {
        queryKey: ['entries'],
        queryFn: dashboardService.fetchEntries,
        staleTime: 300000,
      },
      {
        queryKey: ['exchanges'],
        queryFn: dashboardService.fetchExchanges,
        staleTime: 300000,
      }
    ]
  });

  const [tokensQuery, expensesQuery, entriesQuery, exchangesQuery] = queries;
  const loading = queries.some(query => query.isLoading);
  const error = queries.find(query => query.error)?.error;

  // Process data when available
  useMemo(() => {
    if (!loading && !error) {
      const processedTokens = processTokenData(tokensQuery.data);
      const processedExchanges = processExchangeData(exchangesQuery.data);
      
      setTokens(processedTokens);
      setExpenses(expensesQuery.data);
      setEntries(entriesQuery.data);
      setExchanges(processedExchanges);
      
      // Update metrics and activities
      updateMetrics(processedTokens, entriesQuery.data, processedExchanges);
      const activities = processRecentActivities(
        processedTokens,
        expensesQuery.data,
        processedExchanges,
        entriesQuery.data
      );
      setRecentActivities(activities);
    }
  }, [queries]);

  // ...rest of the existing code...

  return {
    tokens,
    entries,
    expenses,
    exchanges,
    loading,
    error: error?.message,
    recentActivities,
    todayTotal,
    dateRange,
    setDateRange,
    metrics,
    selectedPeriod,
    setSelectedPeriod,
    isRefetching: queries.some(query => query.isRefetching)
  };
};

export default useDashboardData;
