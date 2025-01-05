import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useExchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [filteredExchanges, setFilteredExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/pure-exchange`
      );
      const exchangeData = response.data.data || [];
      const sortedExchanges = exchangeData.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setExchanges(sortedExchanges);
      setError("");
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      setError("Failed to fetch exchanges. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    let parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate)) return parsedDate;
    
    const formats = [
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
      /^(\d{4})-(\d{2})-(\d{2})$/,
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/
    ];
    
    for (const regex of formats) {
      const match = dateStr.match(regex);
      if (match) {
        let year, month, day;
        if (match[3].length === 4) {
          year = match[3];
          month = match[2];
          day = match[1];
        } else {
          year = match[3].length === 2 ? 
            (parseInt(match[3]) > 50 ? '19' : '20') + match[3] : 
            match[3];
          month = match[1];
          day = match[2];
        }
        return new Date(year, month - 1, day);
      }
    }
    return null;
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

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
      await axios.delete(`${process.env.REACT_APP_API_URL}/pure-exchange/${tokenNo}`);
      await fetchExchanges();
    } catch (error) {
      console.error("Error deleting exchange:", error);
      setError("Failed to delete exchange. Please try again.");
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
