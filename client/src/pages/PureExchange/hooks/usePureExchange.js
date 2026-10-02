import { useMutation, useQueryClient } from '@tanstack/react-query';
import pureExchangeService from '../../../services/pureExchangeService';

export const CACHE_KEYS = {
  PURE_EXCHANGES: ['pure-exchanges'], // Changed to array
  PURE_EXCHANGE: ['pure-exchange']     // Changed to array
};

export const usePureExchange = () => {
  const queryClient = useQueryClient();

  // NOTE: this hook deliberately does not run the PURE_EXCHANGES list query.
  // Its only consumer is the PureExchange form, which stages rows locally and
  // never reads the stored list - so the query downloaded the whole table on
  // every page load and the result was thrown away. Because the query was
  // mounted, every successful create also invalidated it, turning a single
  // multi-row save into repeated full-table refetches. Consumers that do need
  // the list should run their own useQuery against CACHE_KEYS.PURE_EXCHANGES;
  // the invalidation in createMutation below keeps such a query fresh.

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
    onSuccess: () => {
      // Keep any mounted list query in sync. No-op while none is mounted, so it
      // costs nothing on the PureExchange form.
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.PURE_EXCHANGES, // Now using array
        refetchType: 'active' // Only refetch active queries
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
    checkExists,
    createPureExchange: createMutation.mutate,
    createPureExchangeAsync: createMutation.mutateAsync,
    updatePureExchange: updateMutation.mutate,
    deletePureExchange: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
