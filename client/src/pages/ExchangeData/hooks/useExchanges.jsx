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
          exchange.tokenno !== tokenNo
        );
  
        
        setExchanges(updatedExchanges);
        setFilteredExchanges(prev => 
          prev.filter(exchange => exchange.tokenno !== tokenNo)
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

  const updateExchange = async (tokenNo, updatedData) => {
    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/pure-exchange/${tokenNo}`,
        updatedData
      );
      
      // Update local state
      const updatedExchanges = exchanges.map(exchange => 
        exchange.tokenNo === tokenNo ? { ...exchange, ...updatedData } : exchange
      );
      setExchanges(updatedExchanges);
      
      // Update filtered exchanges if needed
      setFilteredExchanges(prev => 
        prev.map(exchange => 
          exchange.tokenNo === tokenNo ? { ...exchange, ...updatedData } : exchange
        )
      );

      setMessageWithTimeout(setSuccessMessage, "Exchange updated successfully!");
    } catch (error) {
      console.error("Error updating exchange:", error);
      setMessageWithTimeout(setError, "Failed to update exchange. Please try again.");
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
