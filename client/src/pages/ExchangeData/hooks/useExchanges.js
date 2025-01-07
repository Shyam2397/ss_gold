import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useExchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [filteredExchanges, setFilteredExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/pure-exchange`
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
    try {
      if (!tokenNo) {
        throw new Error('Invalid token number');
      }

      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/pure-exchange/${tokenNo}`);
      
      if (response.status === 200) {
        await fetchExchanges();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to delete exchange');
      }
    } catch (error) {
      console.error("Error deleting exchange:", error);
      if (error.response?.status === 404) {
        throw new Error(`Exchange with token ${tokenNo} not found`);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to delete exchange. Please try again.');
      }
    }
  };

  const clearDates = useCallback(() => {
    setFromDate("");
    setToDate("");
  }, []);

  return {
    exchanges,
    filteredExchanges,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    deleteExchange
  };
};

export default useExchanges;
