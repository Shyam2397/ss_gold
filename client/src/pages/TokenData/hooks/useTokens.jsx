import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const useTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/tokens` 
      );
      const sortedTokens = response.data.sort(
        (a, b) => parseFloat(b.token_no) - parseFloat(a.token_no)
      );
      setTokens(sortedTokens);
      setError("");
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setError("Failed to fetch tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  const filterTokensByDate = useCallback(() => {
    if (!fromDate && !toDate) {
      setFilteredTokens(tokens);
      return;
    }

    const filtered = tokens.filter((token) => {
      const tokenDate = parseDate(token.date);
      const from = fromDate ? parseDate(fromDate) : null;
      const to = toDate ? parseDate(toDate) : null;

      // Reset time to start/end of day for accurate comparison
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);

      if (from && to) {
        return tokenDate >= from && tokenDate <= to;
      }
      if (from) {
        return tokenDate >= from;
      }
      if (to) {
        return tokenDate <= to;
      }
      return true;
    });

    setFilteredTokens(filtered);
  }, [tokens, fromDate, toDate]);

  const deleteToken = async (tokenId) => {
    try {
      await axios.delete(`${API_URL}/tokens/${tokenId}`);
      const updatedTokens = tokens.filter((token) => token.id !== tokenId);
      setTokens(updatedTokens);
      setError("");
    } catch (error) {
      console.error("Error deleting token:", error);
      setError("Failed to delete token. Please try again.");
    }
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    filterTokensByDate();
  }, [fromDate, toDate, tokens, filterTokensByDate]);

  return {
    tokens,
    filteredTokens,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates,
    deleteToken,
    fetchTokens
  };
};

export default useTokens;
