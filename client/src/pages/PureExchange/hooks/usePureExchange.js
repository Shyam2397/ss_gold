import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import pureExchangeService from '../../../services/pureExchangeService';

export const CACHE_KEYS = {
  PURE_EXCHANGES: ['pure-exchanges'], // Changed to array
  PURE_EXCHANGE: ['pure-exchange']     // Changed to array
};

export const usePureExchange = () => {
  const queryClient = useQueryClient();

  // Fetch all pure exchanges with caching
  const { data: pureExchanges, isLoading, error } = useQuery({
    queryKey: CACHE_KEYS.PURE_EXCHANGES, // Now using array
    queryFn: pureExchangeService.getPureExchanges,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Check if pure exchange exists
  const checkExists = async (tokenNo) => {
    // Force a fresh check by bypassing the cache
    return queryClient.fetchQuery({
      queryKey: [...CACHE_KEYS.PURE_EXCHANGE, tokenNo], // Now using array
      queryFn: () => pureExchangeService.checkPureExchangeExists(tokenNo),
      staleTime: 0, // Always consider data stale
      cacheTime: 0, // Don't cache the result
      retry: 1, // Retry once if the request fails
      refetchOnWindowFocus: false // Don't refetch when window regains focus
    });
  };

  // Create pure exchange mutation
  const createMutation = useMutation({
    mutationFn: pureExchangeService.createPureExchange,
    onSuccess: (data, variables) => {
      // Invalidate and refetch pure exchanges list
      queryClient.invalidateQueries({ 
        queryKey: CACHE_KEYS.PURE_EXCHANGES, // Now using array
        refetchType: 'active' // Only refetch active queries
      });
      // Also invalidate the specific token check
      queryClient.invalidateQueries({ 
        queryKey: [...CACHE_KEYS.PURE_EXCHANGE, variables.tokenNo], // Now using array
        refetchActive: true
      });
    },
    // Don't retry on 409 (duplicate) errors
    retry: (failureCount, error) => {
      return error.response?.status !== 409 && failureCount < 3;
    }
  });

  // Update pure exchange mutation
  const updateMutation = useMutation({
    mutationFn: ({ tokenNo, data }) => pureExchangeService.updatePureExchange(tokenNo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURE_EXCHANGES }); // Now using array
    },
  });

  // Delete pure exchange mutation
  const deleteMutation = useMutation({
    mutationFn: pureExchangeService.deletePureExchange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURE_EXCHANGES }); // Now using array
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