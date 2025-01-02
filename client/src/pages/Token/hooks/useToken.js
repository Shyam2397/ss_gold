import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const useToken = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const MESSAGE_TIMEOUT = 5000;

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

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tokens`);
      setTokens(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateTokenNumber = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/tokens/generate`);
      return response.data.tokenNo;
    } catch (error) {
      console.error('Error generating token number:', error);
      setError('Failed to generate token number');
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
      setSuccess('Token saved successfully!');
      await fetchTokens();
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      setError('Failed to save token');
      return false;
    }
  };

  const deleteToken = async (tokenId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/tokens/${tokenId}`);
      setSuccess('Token deleted successfully!');
      await fetchTokens();
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      setError('Failed to delete token');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchNameByCode = async (code) => {
    try {
      const response = await axios.get(`${API_URL}/entries/${code}`);
      return response.data.name || 'Not Found';
    } catch (error) {
      console.error('Error fetching name by code:', error);
      setError('Failed to fetch name');
      return 'Not Found';
    }
  };

  return {
    tokens,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchTokens,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
  };
};

export default useToken;
