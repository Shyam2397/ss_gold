import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPureExchange,
  fetchPureExchanges,
  updatePureExchange,
  deletePureExchange,
  checkPureExchangeExists
} from '../api/pureExchangeApi';

export const CACHE_KEYS = {
  PURE_EXCHANGES: 'pure-exchanges',
  PURE_EXCHANGE: 'pure-exchange'
};

export const usePureExchange = () => {
  const queryClient = useQueryClient();

  // Fetch all pure exchanges with caching
  const { data: pureExchanges, isLoading, error } = useQuery({
    queryKey: [CACHE_KEYS.PURE_EXCHANGES],
    queryFn: fetchPureExchanges,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Check if pure exchange exists
  const checkExists = (tokenNo) => {
    return queryClient.fetchQuery({
      queryKey: [CACHE_KEYS.PURE_EXCHANGE, tokenNo],
      queryFn: () => checkPureExchangeExists(tokenNo),
      staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
  };

  // Create pure exchange mutation
  const createMutation = useMutation({
    mutationFn: createPureExchange,
    onSuccess: () => {
      // Invalidate and refetch pure exchanges list
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.PURE_EXCHANGES] });
    },
  });

  // Update pure exchange mutation
  const updateMutation = useMutation({
    mutationFn: ({ tokenNo, data }) => updatePureExchange(tokenNo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.PURE_EXCHANGES] });
    },
  });

  // Delete pure exchange mutation
  const deleteMutation = useMutation({
    mutationFn: deletePureExchange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.PURE_EXCHANGES] });
    },
  });

  return {
    pureExchanges,
    isLoading,
    error,
    checkExists,
    createPureExchange: createMutation.mutate,
    updatePureExchange: updateMutation.mutate,
    deletePureExchange: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};