import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL;

const useCustomerData = () => {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/entries`);
      setEntries(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching entries:", error);
      setError("Failed to fetch entries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/entries/${id}`);
      setEntries(currentEntries => 
        currentEntries.filter((entry) => entry.id !== id)
      );
      setError("");
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError("Failed to delete entry. Please try again.");
    }
  }, []);

  const exportToExcel = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(entries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");
    XLSX.writeFile(workbook, "customer_data.xlsx");
  }, [entries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    error,
    loading,
    fetchEntries,
    deleteEntry,
    exportToExcel,
    setError
  };
};

export default useCustomerData;
