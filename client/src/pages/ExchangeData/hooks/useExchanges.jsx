import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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
      const response = await axios.get(
        `${API_URL}/pure-exchange`
      );
      const exchangeData = response.data.data || [];
      
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
    
    const formats = [
      // DD/MM/YYYY
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // DD/MM/YY
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/
    ];
    
    for (const regex of formats) {
      const match = dateStr.match(regex);
      if (match) {
        const [, first, second, third] = match;
        let year, month, day;
        
        if (third.length === 4) {
          // DD/MM/YYYY format
          year = third;
          month = second;
          day = first;
        } else if (first.length === 4) {
          // YYYY-MM-DD format
          year = first;
          month = second;
          day = third;
        } else {
          // DD/MM/YY format
          year = (parseInt(third) > 50 ? '19' : '20') + third;
          month = second;
          day = first;
        }
        
        // Create date object and set hours to noon to avoid timezone issues
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        return date;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  useEffect(() => {
    let filtered = [...exchanges];
    const from = parseDate(fromDate);
    const to = parseDate(toDate);

    if (from || to) {
      filtered = filtered.filter(exchange => {
        const exchangeDate = parseDate(exchange.date);
        if (!exchangeDate) return true;
        
        if (from && to) {
          return exchangeDate >= from && exchangeDate <= to;
        }
        if (from) {
          return exchangeDate >= from;
        }
        if (to) {
          return exchangeDate <= to;
        }
        return true;
      });
    }

    setFilteredExchanges(filtered);
  }, [exchanges, fromDate, toDate]);

  const deleteExchange = async (tokenNo) => {
    
    setLoading(true);
    try {
      if (!tokenNo) {

        setMessageWithTimeout(setError, 'Invalid token number');
        return false;
      }

      const response = await axios.delete(`${API_URL}/pure-exchange/${tokenNo}`);
  
      
      if (response.data?.message) {
        // Update local state
        const updatedExchanges = exchanges.filter(exchange => 
          exchange.token_no !== tokenNo
        );
  
        
        setExchanges(updatedExchanges);
        setFilteredExchanges(prev => 
          prev.filter(exchange => exchange.token_no !== tokenNo)
        );
        
        setMessageWithTimeout(setSuccessMessage, response.data.message);
        return true;
      }
      
      throw new Error('Failed to delete exchange');
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

      const response = await axios.put(
        `${API_URL}/pure-exchange/${tokenNo}`,
        processedData
      );
      
      // Convert back to lowercase for local state
      const localData = {
        tokenno: tokenNo,
        date: updatedData.date,
        time: updatedData.time,
        weight: formatWeight(updatedData.weight),
        highest: formatOther(updatedData.highest),
        hweight: formatWeight(updatedData.hweight),
        average: formatOther(updatedData.average),
        aweight: formatWeight(updatedData.aweight),
        goldfineness: formatOther(updatedData.goldfineness),
        gweight: formatWeight(updatedData.gweight),
        exgold: formatOther(updatedData.exgold),
        exweight: formatWeight(updatedData.exweight)
      };
      
      // Update local state with lowercase fields
      const updatedExchanges = exchanges.map(exchange => 
        exchange.tokenno === tokenNo ? { ...exchange, ...localData } : exchange
      );
      setExchanges(updatedExchanges);
      
      // Update filtered exchanges
      setFilteredExchanges(prev => 
        prev.map(exchange => 
          exchange.tokenno === tokenNo ? { ...exchange, ...localData } : exchange
        )
      );

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
