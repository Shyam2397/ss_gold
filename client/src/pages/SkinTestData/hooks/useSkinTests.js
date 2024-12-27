import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useSkinTests = () => {
  const [skinTests, setSkinTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchSkinTests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        process.env.REACT_APP_API_URL + "/skin_tests"
      );
      const sortedData = response.data.data.sort(
        (a, b) => parseFloat(b.token_no) - parseFloat(a.token_no)
      );
      setSkinTests(sortedData);
      setFilteredTests(sortedData);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch skin tests");
    } finally {
      setLoading(false);
    }
  };

  const filterTestsByDate = useCallback(() => {
    if (!fromDate && !toDate) {
      setFilteredTests(skinTests);
      return;
    }

    const filtered = skinTests.filter((test) => {
      const testDate = new Date(test.date);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

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

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    fetchSkinTests();
  }, []);

  useEffect(() => {
    filterTestsByDate();
  }, [fromDate, toDate, skinTests, filterTestsByDate]);

  return {
    skinTests,
    filteredTests,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    clearDates
  };
};

export default useSkinTests;
