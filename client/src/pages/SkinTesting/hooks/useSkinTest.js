import { useState, useCallback } from 'react';
import { initialFormData } from '../constants/initialState';
import { validateForm, processFormData } from '../utils/validation';
import { calculateSum, calculateKarat } from '../utils/calculations';
import {
  fetchSkinTests,
  createSkinTest,
  updateSkinTest,
  deleteSkinTest,
  fetchTokenData,
  fetchPhoneNumber,
} from '../api/skinTestApi';

export const useSkinTest = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [skinTests, setSkinTests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sum, setSum] = useState(0);

  const loadSkinTests = useCallback(async () => {
    setLoading(true);
    try {
      const sortedData = await fetchSkinTests();
      setSkinTests(sortedData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch skin tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFormData = useCallback((name, value) => {
    setFormData((prevFormData) => {
      const newFormData = { ...prevFormData, [name]: value };

      if (name === 'gold_fineness') {
        newFormData.karat = calculateKarat(value);
      }

      const newSum = calculateSum(newFormData);
      setSum(newSum);

      return newFormData;
    });
  }, []);

  const handleTokenChange = async (e) => {
    const { name, value } = e.target;
    if (error) setError('');
    updateFormData(name, value);

    if (name === 'tokenNo' && value) {
      try {
        const response = await fetchTokenData(value);
        if (response.data.data) {
          const { date, time, name, weight, sample, code } = response.data.data;
          setFormData((prevFormData) => ({
            ...prevFormData,
            date,
            time,
            name,
            weight,
            sample,
            code,
            tokenNo: value,
          }));

          const phoneNumber = await fetchPhoneNumber(code);
          if (phoneNumber) {
            setFormData((prevFormData) => ({
              ...prevFormData,
              phoneNumber,
            }));
          }
        } else {
          setError('No token data found for the entered token number.');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Token number not found.');
        } else {
          setError('Failed to fetch token data. Please try again later.');
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError('');
    updateFormData(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData, setError)) return;

    const processedData = processFormData(formData);

    try {
      if (isEditing) {
        await updateSkinTest(processedData.tokenNo, processedData);
        setIsEditing(false);
      } else {
        await createSkinTest(processedData);
      }
      await loadSkinTests();
      setFormData(initialFormData);
      setError('');
      setSum(0);
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      if (err.response?.data?.error === 'Token number already exists') {
        setError('Token number already exists');
      } else {
        setError(err.response?.data?.error || 'Failed to submit form');
      }
    }
  };

  const handleEdit = (test) => {
    setFormData(test);
    setIsEditing(true);
    const newSum = calculateSum(test);
    setSum(newSum);
  };

  const handleDelete = async (tokenNo) => {
    try {
      await deleteSkinTest(tokenNo);
      await loadSkinTests();
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to delete skin test');
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setError('');
    setSum(0);
  };

  return {
    formData,
    skinTests,
    isEditing,
    error,
    loading,
    sum,
    handleTokenChange,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleReset,
    loadSkinTests,
  };
};

export default useSkinTest;
