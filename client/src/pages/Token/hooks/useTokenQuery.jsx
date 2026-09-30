import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import tokenService from '../../../services/tokenService';
import entryService from '../../../services/entryService';
import { sortTokensByTokenNo } from '../utils/tokenSort';
import toast from 'react-hot-toast';

const NAME_CACHE_TTL = 5 * 60 * 1000;

// The API returns is_paid as an INTEGER (0/1) and the money columns as
// DECIMAL, which node-postgres hands back as strings. Normalising on the way in
// keeps the table's strict prop comparison from seeing true !== 1 and
// re-rendering on every poll, and keeps the amount formatter on one code path.
const normalizeToken = (token) => {
  if (!token || typeof token !== 'object') return token;
  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  };
  return {
    ...token,
    isPaid: Boolean(token.isPaid),
    weight: toNumber(token.weight),
    amount: toNumber(token.amount)
  };
};

const useTokenQuery = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nameCacheRef = useRef(new Map());
  const mutationsRef = useRef({});
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
        return sortTokensByTokenNo(data.map(normalizeToken));
      } catch (error) {
        console.error('Error fetching tokens:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch tokens');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from the v4 `cacheTime`)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 30 * 1000, // keeps the list fresh while the page is open
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    }
  });

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
          // PUT /tokens/:id answers with a { success, data } envelope while
          // POST /tokens returns the row itself. Unwrap it so the cache
          // update below always has the same shape to merge.
          const response = await tokenService.updateToken(editId, tokenData);
          return normalizeToken(response?.data ?? response);
        } else {
          return normalizeToken(await tokenService.createToken(tokenData));
        }
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to save token');
      }
    },
    onSuccess: (newToken, variables) => {
      setSuccess('Token saved successfully!');
      setError('');
      toast.success('Token saved successfully!');

      queryClient.setQueryData(['tokens'], (oldTokens = []) => {
        if (variables.editId) {
          // Merge the updated row into its existing entry
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
        const response = await tokenService.deleteToken(tokenId);
        return { ...response, tokenId };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete token');
      }
    },
    onSuccess: (data) => {
      toast.success('Token deleted successfully!');
      setSuccess('Token deleted successfully!');

      queryClient.setQueryData(['tokens'], (oldTokens = []) =>
        oldTokens.filter(token => token.id !== data.tokenId)
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
        const response = await tokenService.updatePaymentStatus(tokenId, isPaid);
        return { ...response, tokenId, isPaid: Boolean(isPaid) };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update payment status');
      }
    },
    onSuccess: (data) => {
      // No toast or banner here: this fires on every checkbox click, so
      // confirming each one buries the messages that actually matter. The
      // checkbox itself already shows the new state, and only failures report.
      queryClient.setQueryData(['tokens'], (oldTokens = []) =>
        oldTokens.map(token =>
          token.id === data.tokenId
            ? { ...token, isPaid: data.isPaid }
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
    const cached = nameCacheRef.current.get(code);
    if (cached && Date.now() - cached.at < NAME_CACHE_TTL) {
      return cached.name;
    }

    try {
      const data = await entryService.getEntryByCode(code);
      const name = data?.data?.name;
      if (name) {
        // Only successful lookups are cached, so a code that is registered a
        // moment later resolves correctly instead of sticking on "Not Found".
        nameCacheRef.current.set(code, { name, at: Date.now() });
        return name;
      }
      return 'Not Found';
    } catch (error) {
      // An unregistered code is a normal outcome that the form reports through
      // validation - it must not raise an error toast. Only a genuine
      // transport/server failure is worth surfacing.
      if (error.response?.status === 404) {
        return 'Not Found';
      }
      console.error('Error fetching name by code:', error);
      toast.error('Failed to fetch name');
      setError('Failed to fetch name');
      return 'Not Found';
    }
  }, []);

  // React Query returns a fresh mutation object on every render, so wrapping
  // mutateAsync directly gave these helpers a new identity each time - which
  // cascaded into the form handlers, the table props and the field memos all
  // re-rendering on every keystroke. Hold the latest callables in a ref and
  // expose genuinely stable wrappers instead.
  useEffect(() => {
    mutationsRef.current = {
      generateTokenNumber: generateTokenNumberMutation.mutateAsync,
      saveToken: saveTokenMutation.mutateAsync,
      deleteToken: deleteTokenMutation.mutateAsync,
      updatePaymentStatus: updatePaymentStatusMutation.mutateAsync
    };
  });

  // Wrapper functions to expose a similar API to the original useToken hook
  const generateTokenNumber = useCallback(async () => {
    try {
      return await mutationsRef.current.generateTokenNumber();
    } catch (error) {
      return null;
    }
  }, []);

  const saveToken = useCallback(async (tokenData, editId = null) => {
    try {
      await mutationsRef.current.saveToken({ tokenData, editId });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const deleteToken = useCallback(async (tokenId) => {
    try {
      await mutationsRef.current.deleteToken(tokenId);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const updatePaymentStatus = useCallback(async (tokenId, isPaid) => {
    try {
      await mutationsRef.current.updatePaymentStatus({ tokenId, isPaid });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // The page destructures this immediately, so the object's identity is
  // irrelevant - every field above is already referentially stable. `tokens` is
  // used directly: React Query returns a structurally shared array, and
  // wrapping it in a JSON.stringify dependency used to re-serialise the whole
  // list on every render.
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