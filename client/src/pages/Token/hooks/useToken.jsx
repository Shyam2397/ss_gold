import { useReducer, useCallback, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

const API_URL = import.meta.env.VITE_API_URL;

// Add request cache
const requestCache = new Map();

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

  const fetchTokens = useCallback(async () => {
    const cacheKey = 'tokens';
    if (requestCache.has(cacheKey)) {
      dispatch({ type: 'SET_TOKENS', tokens: requestCache.get(cacheKey) });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const response = await axios.get(`${API_URL}/tokens`);
      dispatch({ type: 'SET_TOKENS', tokens: response.data });
      requestCache.set(cacheKey, response.data);
      dispatch({ type: 'SET_ERROR', error: '' });
    } catch (error) {
      console.error('Error fetching tokens:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to fetch tokens' });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, []);

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

  const saveToken = async (tokenData, editId = null) => {
    try {
      if (editId) {
        await axios.put(`${API_URL}/tokens/${editId}`, tokenData);
      } else {
        await axios.post(`${API_URL}/tokens`, tokenData);
      }
      dispatch({ type: 'SET_SUCCESS', message: 'Token saved successfully!' });
      invalidateCache();
      await fetchTokens(); // Refresh token list
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to save token' });
      return false;
    }
  };

  const deleteToken = async (tokenId) => {
    try {
      dispatch({ type: 'SET_LOADING', value: true });
      await axios.delete(`${API_URL}/tokens/${tokenId}`);
      dispatch({ type: 'SET_SUCCESS', message: 'Token deleted successfully!' });
      invalidateCache();
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
      invalidateCache();
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
