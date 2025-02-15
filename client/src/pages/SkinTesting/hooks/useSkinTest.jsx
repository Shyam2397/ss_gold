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
      setLoading(true);
      try {
        // Fetch token data
        const response = await fetchTokenData(value);
        
        if (response.data.success && response.data.data) {
          const { date, time, name, weight, sample, code } = response.data.data;
          
          // Update form with token data
          setFormData((prevFormData) => ({
            ...prevFormData,
            date: date || '',
            time: time || '',
            name: name || '',
            weight: weight ? parseFloat(weight).toFixed(3) : '',
            sample: sample || '',
            code: code || '',
            tokenNo: value,
          }));

          // If we have a code, fetch phone number
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
              console.error('Failed to fetch phone number:', phoneErr);
            }
          }
        } else {
          setError(response.data.message || 'No token data found.');
          clearFormFields();
        }
      } catch (err) {
        console.error('Token fetch error:', err);
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
        // Ensure we have the tokenNo
        if (!formData.tokenNo) {
          throw new Error('Token number is required for updating');
        }

        console.log('Updating skin test:', {
          tokenNo: formData.tokenNo,
          formData: formData
        });

        // During edit, ensure we're using the original token number
        const processedData = processFormData({
          ...formData,
          tokenNo: formData.tokenNo // Ensure tokenNo is preserved
        });

        console.log('Processed data for update:', processedData);

        const response = await updateSkinTest(processedData.tokenNo, processedData);
        console.log('Update successful:', response);
        
        setIsEditing(false);
        await loadSkinTests();
        setFormData(initialFormData);
        setError('');
        setSum(0);
      } else {
        // For new entries, process the data normally
        const processedData = processFormData(formData);
        // Check for duplicate token number during creation
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
      console.error('Submit error details:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        formData: formData,
        isEditing: isEditing
      });

      // Set a more user-friendly error message
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
      
      // Get tokenNo from either camelCase or lowercase version
      const tokenNo = test.tokenNo || test.tokenno;
      
      // Ensure we have the tokenNo
      if (!tokenNo) {
        console.error('Missing token number in test data:', test);
        throw new Error('Token number is required for editing');
      }
      
      // For editing, we'll use the test data directly since it's already complete
      const editData = {
        ...test,
        tokenNo: tokenNo, // Use the found tokenNo
        // Ensure weight is formatted correctly
        weight: test.weight ? parseFloat(test.weight).toFixed(3) : '',
      };

      console.log('Edit data prepared:', editData);

      // If we have a code, fetch latest phone number
      if (editData.code) {
        try {
          const phoneNumber = await fetchPhoneNumber(editData.code);
          if (phoneNumber) {
            editData.phoneNumber = phoneNumber;
          }
        } catch (phoneErr) {
          console.error('Failed to fetch phone number during edit:', phoneErr);
          // Don't block edit if phone number fetch fails
        }
      }

      setFormData(editData);
      setIsEditing(true);
      const newSum = calculateSum(editData);
      setSum(newSum);
    } catch (err) {
      console.error('Error during edit:', err);
      setError('Failed to prepare data for editing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tokenNo) => {
    if (!tokenNo) {
      setError('Invalid token number for deletion');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this skin test?')) {
        return;
      }

      const response = await deleteSkinTest(tokenNo);
      
      if (response.data?.success) {
        // Clear form if we're editing the same token that's being deleted
        if (isEditing && formData.tokenNo === tokenNo) {
          handleReset();
        }
        
        await loadSkinTests();
      } else {
        throw new Error(response.data?.message || 'Failed to delete skin test');
      }
    } catch (err) {
      console.error('Error during deletion:', err);
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
