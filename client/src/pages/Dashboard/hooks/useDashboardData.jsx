import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import * as dashboardService from '../services/dashboardService';
import { dashboardReducer, initialState, actionTypes } from '../reducers/dashboardReducer';

// Debounce function for limiting rapid state updates
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const useDashboardData = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const isMounted = useRef(true);

  // Debounced dispatch to prevent too frequent updates
  const debouncedDispatch = useMemo(
    () => debounce((action) => {
      if (isMounted.current) {
        dispatch(action);
      }
    }, 100),
    []
  );

  const queries = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'tokens'], // Fixed: Array format for React Query v4
        queryFn: dashboardService.fetchTokens,
        staleTime: 300000, // 5 minutes
        refetchInterval: 300000,
        // Add cacheTime to keep data in cache even when not active
        cacheTime: 600000, // 10 minutes
      },
      {
        queryKey: ['dashboard', 'expenses'], // Fixed: Array format for React Query v4
        queryFn: dashboardService.fetchExpenses,
        staleTime: 300000,
        cacheTime: 600000,
      },
      {
        queryKey: ['dashboard', 'entries'], // Fixed: Array format for React Query v4
        queryFn: dashboardService.fetchEntries,
        staleTime: 300000,
        cacheTime: 600000,
      },
      {
        queryKey: ['dashboard', 'exchanges'], // Fixed: Array format for React Query v4
        queryFn: dashboardService.fetchExchanges,
        staleTime: 300000,
        cacheTime: 600000,
      }
    ]
  });

  const [tokensQuery, expensesQuery, entriesQuery, exchangesQuery] = queries;
  const loading = queries.some(query => query.isLoading);
  const error = queries.find(query => query.error)?.error;

  useEffect(() => {
    if (!loading && !error) {
      debouncedDispatch({
        type: actionTypes.SET_DATA_WITH_METRICS,
        payload: {
          tokens: tokensQuery.data || [],
          expenses: expensesQuery.data || [],
          entries: entriesQuery.data || [],
          exchanges: exchangesQuery.data || []
        }
      });
    }
  }, [tokensQuery.data, expensesQuery.data, entriesQuery.data, exchangesQuery.data, loading, error, debouncedDispatch]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    dashboardService.clearDashboardCache();
    queries.forEach(query => {
      if (query.refetch) query.refetch();
    });
  }, [queries]);

  return {
    ...state,
    dispatch,
    loading,
    error: error?.message,
    isRefetching: queries.some(query => query.isRefetching),
    refreshData,
    recentActivities: state.recentActivities || []
  };
};

export default useDashboardData;