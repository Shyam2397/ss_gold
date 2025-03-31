import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import * as dashboardService from '../services/dashboardService';
import { dashboardReducer, initialState, actionTypes } from '../reducers/dashboardReducer';

const useDashboardData = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

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

  useEffect(() => {
    if (!loading && !error) {
      dispatch({
        type: actionTypes.SET_DATA_WITH_METRICS,
        payload: {
          tokens: tokensQuery.data,
          expenses: expensesQuery.data,
          entries: entriesQuery.data,
          exchanges: exchangesQuery.data
        }
      });
    }
  }, [tokensQuery.data, expensesQuery.data, entriesQuery.data, exchangesQuery.data, loading, error]);

  return {
    ...state,
    dispatch,
    loading,
    error: error?.message,
    isRefetching: queries.some(query => query.isRefetching)
  };
};

export default useDashboardData;
