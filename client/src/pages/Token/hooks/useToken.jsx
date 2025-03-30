import { useReducer, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { unstable_batchedUpdates as batch } from 'react-dom';

const API_URL = import.meta.env.VITE_API_URL;

// Add cache configuration
const CACHE_CONFIG = {
  MAX_AGE: 5 * 60 * 1000, // 5 minutes
  STALE_WHILE_REVALIDATE: true
};

// Enhanced cache implementation
class Cache {
  constructor() {
    this.store = new Map();
  }

  set(key, value) {
    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > CACHE_CONFIG.MAX_AGE) {
      if (!CACHE_CONFIG.STALE_WHILE_REVALIDATE) {
        this.store.delete(key);
        return null;
      }
    }
    return item.value;
  }

  clear() {
    this.store.clear();
  }
}

const requestCache = new Cache();

const initialState = {
  tokens: [],
  loading: false,
  error: '',
  success: ''
};

const tokenHookReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_TOKENS':
      return { ...state, tokens: action.tokens };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_SUCCESS':
      return { ...state, success: action.message };
    default:
      return state;
  }
};

const useToken = () => {
  const [state, dispatch] = useReducer(tokenHookReducer, initialState);
  const abortControllerRef = useRef(null);
  const MESSAGE_TIMEOUT = 5000;

  useEffect(() => {
    let successTimer;
    if (state.success) {
      successTimer = setTimeout(() => {
        dispatch({ type: 'SET_SUCCESS', message: '' });
      }, MESSAGE_TIMEOUT);
    }
    return () => {
      if (successTimer) clearTimeout(successTimer);
    };
  }, [state.success]);

  // Batch multiple dispatches
  const batchedDispatch = useCallback((actions) => {
    batch(() => {
      actions.forEach(action => dispatch(action));
    });
  }, []);

  // Enhance fetchTokens with better caching and error handling
  const fetchTokens = useCallback(async () => {
    const cacheKey = 'tokens';
    const cachedData = requestCache.get(cacheKey);
    
    if (cachedData) {
      dispatch({ type: 'SET_TOKENS', tokens: cachedData });
      
      // Revalidate in background if stale
      if (CACHE_CONFIG.STALE_WHILE_REVALIDATE) {
        fetchTokens().catch(console.error);
      }
      return;
    }
    
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const response = await axios.get(`${API_URL}/tokens`, {
        signal: abortControllerRef.current.signal
      });
      
      batchedDispatch([
        { type: 'SET_TOKENS', tokens: response.data },
        { type: 'SET_ERROR', error: '' }
      ]);
      
      requestCache.set(cacheKey, response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching tokens:', error);
        dispatch({ type: 'SET_ERROR', error: 'Failed to fetch tokens' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, [batchedDispatch]);

  const generateTokenNumber = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/tokens/generate`);
      if (response.data.error) {
        dispatch({ type: 'SET_ERROR', error: response.data.error });
        return null;
      }
      return response.data.tokenNo;
    } catch (error) {
      console.error('Error generating token number:', error);
      dispatch({ type: 'SET_ERROR', error: error.response?.data?.error || 'Failed to generate token number' });
      return null;
    }
  }, []);

  // Optimize saveToken with batch updates
  const saveToken = useCallback(async (tokenData, editId = null) => {
    try {
      const endpoint = editId ? `${API_URL}/tokens/${editId}` : `${API_URL}/tokens`;
      const method = editId ? 'put' : 'post';
      
      await axios[method](endpoint, tokenData);
      
      batchedDispatch([
        { type: 'SET_SUCCESS', message: 'Token saved successfully!' },
        { type: 'SET_ERROR', error: '' }
      ]);
      
      requestCache.clear();
      await fetchTokens();
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to save token' });
      return false;
    }
  }, [batchedDispatch, fetchTokens]);

  const deleteToken = async (tokenId) => {
    try {
      dispatch({ type: 'SET_LOADING', value: true });
      await axios.delete(`${API_URL}/tokens/${tokenId}`);
      dispatch({ type: 'SET_SUCCESS', message: 'Token deleted successfully!' });
      requestCache.clear();
      await fetchTokens(); // Refresh token list
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to delete token' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  };

  const fetchNameByCode = async (code) => {
    try {
      const response = await axios.get(`${API_URL}/entries/${code}`);
      return response.data.data?.name || 'Not Found';
    } catch (error) {
      console.error('Error fetching name by code:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to fetch name' });
      return 'Not Found';
    }
  };

  // Add request debouncing for frequent calls
  const debouncedFetchName = useCallback(
    debounce(async (code) => {
      const response = await axios.get(`${API_URL}/entries/${code}`);
      return response.data.data?.name || 'Not Found';
    }, 300),
    []
  );

  // Fix cache reference
  const invalidateCache = useCallback(() => {
    requestCache.clear();
  }, []);

  const updatePaymentStatus = async (tokenId, isPaid) => {
    try {
      dispatch({ type: 'SET_LOADING', value: true });
      await axios.patch(`${API_URL}/tokens/${tokenId}/payment`, { isPaid });
      dispatch({ type: 'SET_SUCCESS', message: 'Payment status updated successfully!' });
      requestCache.clear();
      await fetchTokens(); // Refresh token list
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to update payment status' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    fetchTokens,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
    debouncedFetchName,
    invalidateCache,
    updatePaymentStatus
  };
};

export default useToken;
