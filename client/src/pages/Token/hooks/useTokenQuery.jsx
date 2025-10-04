import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { unstable_batchedUpdates as batch } from 'react-dom';
import tokenService from '../../../services/tokenService';
import entryService from '../../../services/entryService';
import toast from 'react-hot-toast';

const useTokenQuery = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const MESSAGE_TIMEOUT = 5000;

  // Clear success message after timeout
  useEffect(() => {
    let successTimer;
    if (success) {
      successTimer = setTimeout(() => {
        setSuccess('');
      }, MESSAGE_TIMEOUT);
    }
    return () => {
      if (successTimer) clearTimeout(successTimer);
    };
  }, [success]);

  // Clear error message after timeout
  useEffect(() => {
    let errorTimer;
    if (error) {
      errorTimer = setTimeout(() => {
        setError('');
      }, MESSAGE_TIMEOUT);
    }
    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [error]);

  // Query for fetching tokens
  const {
    data: tokens = [],
    isLoading: loading,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      try {
        const data = await tokenService.getTokens();
        // Sort tokens by token_no in descending order
        return data.sort((a, b) => 
          parseFloat(b.token_no) - parseFloat(a.token_no)
        );
      } catch (error) {
        console.error('Error fetching tokens:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch tokens');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches the existing cache config)
    onError: (err) => {
      setError(err.message);
    }
  });

  // Memoize tokens to prevent unnecessary re-renders
  const memoizedTokens = useMemo(() => tokens, [JSON.stringify(tokens)]);

  // Mutation for generating token number
  const generateTokenNumberMutation = useMutation({
    mutationFn: async () => {
      try {
        const data = await tokenService.generateTokenNumber();
        return data.tokenNo;
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to generate token number');
      }
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    }
  });

  // Mutation for saving token
  const saveTokenMutation = useMutation({
    mutationFn: async ({ tokenData, editId = null }) => {
      try {
        if (editId) {
          return await tokenService.updateToken(editId, tokenData);
        } else {
          return await tokenService.createToken(tokenData);
        }
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to save token');
      }
    },
    onSuccess: (newToken, variables) => {
      batch(() => {
        setSuccess('Token saved successfully!');
        setError('');
      });
      toast.success('Token saved successfully!');
      
      // Use setQueryData instead of invalidateQueries for better performance
      queryClient.setQueryData(['tokens'], (oldTokens = []) => {
        if (variables.editId) {
          // Update existing token
          return oldTokens.map(token => 
            token.id === variables.editId ? { ...token, ...newToken } : token
          );
        } else {
          // Add new token to the beginning of the list
          return [newToken, ...oldTokens];
        }
      });
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    }
  });

  // Mutation for deleting token
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId) => {
      try {
        return await tokenService.deleteToken(tokenId);
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete token');
      }
    },
    onSuccess: (data, tokenId) => {
      toast.success('Token deleted successfully!');
      setSuccess('Token deleted successfully!');
      
      // Use setQueryData instead of invalidateQueries for better performance
      queryClient.setQueryData(['tokens'], (oldTokens = []) => 
        oldTokens.filter(token => token.id !== tokenId)
      );
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    }
  });

  // Mutation for updating payment status
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ tokenId, isPaid }) => {
      try {
        return await tokenService.updatePaymentStatus(tokenId, isPaid);
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update payment status');
      }
    },
    onSuccess: (updatedToken, variables) => {
      toast.success('Payment status updated successfully!');
      setSuccess('Payment status updated successfully!');
      
      // Use setQueryData instead of invalidateQueries for better performance
      queryClient.setQueryData(['tokens'], (oldTokens = []) => 
        oldTokens.map(token => 
          token.id === variables.tokenId 
            ? { ...token, isPaid: variables.isPaid } 
            : token
        )
      );
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    }
  });

  // Query for fetching name by code
  const fetchNameByCode = useCallback(async (code) => {
    try {
      const data = await entryService.getEntryByCode(code);
      return data?.data?.name || 'Not Found';
    } catch (error) {
      console.error('Error fetching name by code:', error);
      toast.error('Failed to fetch name');
      setError('Failed to fetch name');
      return 'Not Found';
    }
  }, []);

  // Wrapper functions to expose a similar API to the original useToken hook
  const generateTokenNumber = useCallback(async () => {
    try {
      return await generateTokenNumberMutation.mutateAsync();
    } catch (error) {
      return null;
    }
  }, [generateTokenNumberMutation]);

  const saveToken = useCallback(async (tokenData, editId = null) => {
    try {
      await saveTokenMutation.mutateAsync({ tokenData, editId });
      return true;
    } catch (error) {
      return false;
    }
  }, [saveTokenMutation]);

  const deleteToken = useCallback(async (tokenId) => {
    try {
      await deleteTokenMutation.mutateAsync(tokenId);
      return true;
    } catch (error) {
      return false;
    }
  }, [deleteTokenMutation]);

  const updatePaymentStatus = useCallback(async (tokenId, isPaid) => {
    try {
      await updatePaymentStatusMutation.mutateAsync({ tokenId, isPaid });
      return true;
    } catch (error) {
      return false;
    }
  }, [updatePaymentStatusMutation]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    tokens: memoizedTokens,
    loading,
    error,
    success,
    fetchTokens: refetchTokens,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
    updatePaymentStatus
  }), [memoizedTokens, loading, error, success, refetchTokens, generateTokenNumber, saveToken, deleteToken, fetchNameByCode, updatePaymentStatus]);
};

export default useTokenQuery;