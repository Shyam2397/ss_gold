import { useState, useEffect, useCallback } from 'react';
import exchangeService from '../../../services/exchangeService';

const useExchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [filteredExchanges, setFilteredExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Function to set messages with timeout
  const setMessageWithTimeout = (setterFunction, message) => {
    setterFunction(message);
    setTimeout(() => {
      setterFunction("");
    }, 3000);
  };

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const exchangeData = await exchangeService.getExchanges();
      
      // Parse dates and sort
      const sortedExchanges = exchangeData.sort((a, b) => {
        // First try to parse using the parseDate function
        let dateA = parseDate(a.date);
        let dateB = parseDate(b.date);
        
        // If parsing failed, try direct Date conversion
        if (!dateA) dateA = new Date(a.date);
        if (!dateB) dateB = new Date(b.date);
        
        // Compare timestamps
        return dateB.getTime() - dateA.getTime();
      });
      
      setExchanges(sortedExchanges);
      setError("");
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      setError("Failed to fetch exchanges. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // First try to parse with Date object (handles most standard formats)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Set to noon to avoid timezone issues
      date.setHours(12, 0, 0, 0);
      return date;
    }
    
    // If that fails, try specific formats
    const formats = [
      // YYYY-MM-DD (ISO format)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD/MM/YYYY
      /^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/,
      // MM/DD/YYYY
      /^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/,
      // DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // YYYY/MM/DD
      /^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/,
      // YYYYMMDD
      /^(\d{4})(\d{2})(\d{2})$/,
      // DDMMYYYY
      /^(\d{2})(\d{2})(\d{4})$/,
      // DD/MM/YY
      /^(\d{1,2})[\/](\d{1,2})[\/](\d{2})$/,
      // DD-MM-YY
      /^(\d{1,2})-(\d{1,2})-(\d{2})$/,
    ];
    
    const normalizedStr = dateStr.toString().trim();
    
    for (const regex of formats) {
      const match = normalizedStr.match(regex);
      if (match) {
        let year, month, day;
        
        // Determine format based on match groups
        if (match[0].length === 8 && match[1].length === 4) {
          // YYYYMMDD format
          year = match[1];
          month = match[2];
          day = match[3];
        } else if (match[0].length === 8 && match[3]?.length === 4) {
          // DDMMYYYY format (if last group is 4 digits)
          day = match[1];
          month = match[2];
          year = match[3];
        } else if (match[1].length === 4) {
          // YYYY-MM-DD or YYYY/MM/DD format
          year = match[1];
          month = match[2];
          day = match[3];
        } else if (match[3]?.length === 4) {
          // DD/MM/YYYY or DD-MM-YYYY format
          day = match[1];
          month = match[2];
          year = match[3];
        } else if (match[3]?.length === 2) {
          // DD/MM/YY or DD-MM-YY format
          day = match[1];
          month = match[2];
          year = (parseInt(match[3]) > 50 ? '19' : '20') + match[3];
        } else {
          // Default to first three groups if can't determine format
          day = match[1];
          month = match[2];
          year = match[3] || new Date().getFullYear();
        }
        
        try {
          // Create date object and set hours to noon to avoid timezone issues
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        } catch (e) {
          console.warn('Error parsing date:', e);
        }
      }
    }
    
    console.warn('Could not parse date:', dateStr);
    return null;
  };

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  useEffect(() => {
    let filtered = [...exchanges];
    
    // Parse the filter dates
    const from = fromDate ? parseDate(fromDate) : null;
    const to = toDate ? parseDate(toDate) : null;
    
    // If both dates are invalid, show all
    if ((fromDate && !from) && (toDate && !to)) {
      setFilteredExchanges(filtered);
      return;
    }
    
    // Filter the exchanges
    filtered = filtered.filter(exchange => {
      const exchangeDate = parseDate(exchange.date);
      
      // If we can't parse the exchange date, include it to be safe
      if (!exchangeDate) return true;
      
      // Apply date range filter
      const afterFrom = !from || exchangeDate >= from;
      const beforeTo = !to || exchangeDate <= to;
      
      return afterFrom && beforeTo;
    });
    
    setFilteredExchanges(filtered);
  }, [exchanges, fromDate, toDate]);

  const deleteExchange = async (tokenNo) => {
    setLoading(true);
    try {
      if (!tokenNo) {
        setMessageWithTimeout(setError, 'Invalid token number');
        return false;
      }

      const response = await exchangeService.deleteExchange(tokenNo);
      
      // Instead of updating local state, refetch the data to ensure consistency
      await fetchExchanges();
      
      setMessageWithTimeout(setSuccessMessage, response.message || 'Exchange deleted successfully');
      return true;
    } catch (error) {
      console.error("Error deleting exchange:", error);
      let errorMessage = 'Failed to delete exchange. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = `Exchange with token ${tokenNo} not found`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setMessageWithTimeout(setError, errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearDates = useCallback(() => {
    setFromDate("");
    setToDate("");
  }, []);

  const updateExchange = async (updatedData) => {
    setLoading(true);
    try {
      const tokenNo = updatedData.tokenno;
      if (!tokenNo) {
        setMessageWithTimeout(setError, "Invalid token number");
        return;
      }

      // Format numbers to exactly 3 decimal places for weights and 2 for others
      const formatWeight = (value) => {
        const numValue = parseFloat(value || 0);
        return parseFloat(numValue.toFixed(3));
      };

      const formatOther = (value) => {
        const numValue = parseFloat(value || 0);
        return parseFloat(numValue.toFixed(2));
      };

      // Convert numeric string values to numbers and use correct field names
      const processedData = {
        tokenNo: tokenNo,
        date: updatedData.date,
        time: updatedData.time,
        weight: formatWeight(updatedData.weight),
        highest: formatOther(updatedData.highest),
        hWeight: formatWeight(updatedData.hweight),
        average: formatOther(updatedData.average),
        aWeight: formatWeight(updatedData.aweight),
        goldFineness: formatOther(updatedData.goldfineness),
        gWeight: formatWeight(updatedData.gweight),
        exGold: formatOther(updatedData.exgold),
        exWeight: formatWeight(updatedData.exweight)
      };

      console.log('Updating exchange with data:', processedData);

      await exchangeService.updateExchange(tokenNo, processedData);
      
      // Instead of updating local state, refetch the data to ensure consistency
      await fetchExchanges();
      
      setMessageWithTimeout(setSuccessMessage, "Exchange updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating exchange:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Failed to update exchange. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = `Exchange with token ${tokenNo} not found`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setMessageWithTimeout(setError, errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    exchanges,
    filteredExchanges,
    loading,
    error,
    successMessage,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    deleteExchange,
    updateExchange,
    fetchExchanges
  };
};

export default useExchanges;
