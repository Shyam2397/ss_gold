import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Function to fetch skin tests data
const fetchSkinTests = async () => {
  const response = await axios.get(`${API_URL}/skin-tests`);
  const data = response.data?.data || response.data || [];
  return Array.isArray(data) 
    ? data.sort((a, b) => parseFloat(b.token_no || 0) - parseFloat(a.token_no || 0)) 
    : [];
};

const useSkinTests = () => {
  const [filteredTests, setFilteredTests] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Use React Query to fetch and cache skin tests data
  const { 
    data: skinTests = [], 
    isLoading: loading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['skinTests'],
    queryFn: fetchSkinTests,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      // Initialize filtered tests with all tests when data is loaded
      if (!fromDate && !toDate) {
        setFilteredTests(data);
      }
    }
  });
  
  // Format error message
  const error = queryError ? "Failed to fetch skin tests" : "";

  const parseDate = (dateStr) => {
    // Try parsing with different strategies
    let parsedDate = new Date(dateStr);
    
    // If ISO parsing fails, try manual parsing
    if (isNaN(parsedDate)) {
      // Common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
      const formats = [
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,  // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{4})-(\d{2})-(\d{2})$/,            // YYYY-MM-DD
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/   // DD/MM/YY or MM/DD/YY
      ];
      
      for (const regex of formats) {
        const match = dateStr.match(regex);
        if (match) {
          let year, month, day;
          if (match[3].length === 4) {
            // YYYY-MM-DD or DD/MM/YYYY
            year = match[3];
            month = match[2];
            day = match[1];
          } else {
            // YY format or swapped
            year = match[3].length === 2 ? 
              (parseInt(match[3]) > 50 ? '19' : '20') + match[3] : 
              match[3];
            month = match[1];
            day = match[2];
          }
          
          parsedDate = new Date(year, month - 1, day);
          break;
        }
      }
    }
    
    return parsedDate;
  };

  const filterTestsByDate = useCallback(() => {
    if (!fromDate && !toDate) {
      setFilteredTests(skinTests);
      return;
    }

    const filtered = skinTests.filter((test) => {
      const testDate = parseDate(test.date);
      const from = fromDate ? parseDate(fromDate) : null;
      const to = toDate ? parseDate(toDate) : null;

      // Reset time to start/end of day for accurate comparison
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);

      if (from && to) {
        return testDate >= from && testDate <= to;
      }
      if (from) {
        return testDate >= from;
      }
      if (to) {
        return testDate <= to;
      }
      return true;
    });

    setFilteredTests(filtered);
  }, [skinTests, fromDate, toDate]);

  // Effect to apply date filtering whenever dates or skin tests data changes
  useEffect(() => {
    if (skinTests?.length) {
      filterTestsByDate();
    }
  }, [filterTestsByDate, skinTests, fromDate, toDate]);

  const clearDates = () => {
    setFromDate("");
    setToDate("");
    // Reset to all tests when dates are cleared
    if (skinTests?.length) {
      setFilteredTests(skinTests);
    }
  };

  return {
    skinTests,
    filteredTests,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    refetch // Expose refetch function for manual data refresh
  };
};

export default useSkinTests;
