import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';
import { unstable_batchedUpdates as batch } from 'react-dom';

const API_URL = import.meta.env.VITE_API_URL;

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

  // Query for fetching tokens
  const {
    data: tokens = [],
    isLoading: loading,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/tokens`);
        return response.data;
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error fetching tokens:', error);
          throw new Error('Failed to fetch tokens');
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches the existing cache config)
    onError: (err) => {
      setError(err.message);
    }
  });

  // Mutation for generating token number
  const generateTokenNumberMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(`${API_URL}/tokens/generate`);
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      return response.data.tokenNo;
    },
    onError: (error) => {
      setError(error.message || 'Failed to generate token number');
    }
  });

  // Mutation for saving token
  const saveTokenMutation = useMutation({
    mutationFn: async ({ tokenData, editId = null }) => {
      const endpoint = editId ? `${API_URL}/tokens/${editId}` : `${API_URL}/tokens`;
      const method = editId ? 'put' : 'post';
      
      const response = await axios[method](endpoint, tokenData);
      return response.data;
    },
    onSuccess: () => {
      batch(() => {
        setSuccess('Token saved successfully!');
        setError('');
      });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error) => {
      setError(error.message || 'Failed to save token');
    }
  });

  // Mutation for deleting token
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId) => {
      const response = await axios.delete(`${API_URL}/tokens/${tokenId}`);
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Token deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error) => {
      setError(error.message || 'Failed to delete token');
    }
  });

  // Mutation for updating payment status
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ tokenId, isPaid }) => {
      const response = await axios.patch(`${API_URL}/tokens/${tokenId}/payment`, { isPaid });
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Payment status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error) => {
      setError(error.message || 'Failed to update payment status');
    }
  });

  // Query for fetching name by code
  const fetchNameByCode = useCallback(async (code) => {
    try {
      const response = await axios.get(`${API_URL}/entries/${code}`);
      return response.data.data?.name || 'Not Found';
    } catch (error) {
      console.error('Error fetching name by code:', error);
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

  // Expose the same API as the original useToken hook
  return {
    tokens,
    loading,
    error,
    success,
    fetchTokens: refetchTokens,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
    updatePaymentStatus
  };
};

export default useTokenQuery;