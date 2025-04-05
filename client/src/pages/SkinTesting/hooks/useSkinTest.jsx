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
      
      // Fetch phone numbers for each test that has a code
      const testsWithPhoneNumbers = await Promise.all(
        sortedData.map(async (test) => {
          if (test.code) {
            try {
              const phoneNumber = await fetchPhoneNumber(test.code);
              return { ...test, phoneNumber: phoneNumber || '' };
            } catch (err) {
              return test;
            }
          }
          return test;
        })
      );
      
      setSkinTests(testsWithPhoneNumbers);
    } catch (err) {
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
      setLoading(true);
      try {
        const response = await fetchTokenData(value);
        
        if (response.data.success && response.data.data) {
          const { date, time, name, weight, sample, code } = response.data.data;
          
          setFormData((prevFormData) => ({
            ...prevFormData,
            date: date || '',  // Use the date directly from the server without any conversion
            time: time || '',
            name: name || '',
            weight: weight ? parseFloat(weight).toFixed(3) : '',
            sample: sample || '',
            code: code || '',
            tokenNo: value,
          }));

          if (code) {
            try {
              const phoneNumber = await fetchPhoneNumber(code);
              if (phoneNumber) {
                setFormData((prevFormData) => ({
                  ...prevFormData,
                  phoneNumber,
                }));
              }
            } catch (phoneErr) {
              // Handle phone number error silently
            }
          }
        } else {
          setError(response.data.message || 'No token data found.');
          clearFormFields();
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Token number not found.');
        } else {
          setError('Failed to fetch token data. Please try again.');
        }
        clearFormFields();
      } finally {
        setLoading(false);
      }
    }
  };

  const clearFormFields = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      date: '',
      time: '',
      name: '',
      weight: '',
      sample: '',
      code: '',
      phoneNumber: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent token number changes during editing
    if (isEditing && name === 'tokenNo') {
      return;
    }
    
    if (error) setError('');
    updateFormData(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData, setError, isEditing)) return;

    try {
      setLoading(true);
      if (isEditing) {
        if (!formData.tokenNo) {
          throw new Error('Token number is required for updating');
        }

        const processedData = processFormData({
          ...formData,
          tokenNo: formData.tokenNo
        });

        await updateSkinTest(processedData.tokenNo, processedData);
        setIsEditing(false);
        await loadSkinTests();
        setFormData(initialFormData);
        setError('');
        setSum(0);
      } else {
        const processedData = processFormData(formData);
        const exists = skinTests.some(test => test.tokenNo === processedData.tokenNo);
        if (exists) {
          setError('Token number already exists');
          return;
        }
        await createSkinTest(processedData);
        await loadSkinTests();
        setFormData(initialFormData);
        setError('');
        setSum(0);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to submit form';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (test) => {
    try {
      setLoading(true);
      setError('');
      
      const tokenNo = test.tokenNo || test.token_no;
      
      if (!tokenNo) {
        throw new Error('Token number is required for editing');
      }
      
      // Preserve the original date format from the server
      // The server returns dates in YYYY-MM-DD format
      let formattedDate = test.date;
      // Only reformat if it's in DD-MM-YYYY format
      if (formattedDate && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(formattedDate)) {
        const dateParts = formattedDate.split(/[-/]/);
        formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      }

      const editData = {
        ...test,
        tokenNo: tokenNo,
        date: formattedDate || '',
        weight: test.weight ? parseFloat(test.weight).toFixed(3) : '',
      };

      if (editData.code) {
        try {
          const phoneNumber = await fetchPhoneNumber(editData.code);
          if (phoneNumber) {
            editData.phoneNumber = phoneNumber;
          }
        } catch (phoneErr) {
          // Remove console.error for phone number fetch
        }
      }

      setFormData(editData);
      setIsEditing(true);
      const newSum = calculateSum(editData);
      setSum(newSum);
    } catch (err) {
      setError('Failed to prepare data for editing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tokenNo) => {
    const normalizedTokenNo = tokenNo?.toString().trim();
    
    if (!normalizedTokenNo) {
      setError('Invalid token number for deletion');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await deleteSkinTest(normalizedTokenNo);
      
      if (response.data?.success) {
        if (isEditing && formData.tokenNo === normalizedTokenNo) {
          handleReset();
        }
        await loadSkinTests();
      } else {
        throw new Error(response.data?.message || 'Failed to delete skin test');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete skin test. Please try again.');
    } finally {
      setLoading(false);
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
