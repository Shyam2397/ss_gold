import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { exportToExcel } from '../../../utils/excelExport';

const API_URL = import.meta.env.VITE_API_URL;

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

  const handleExport = async (data) => {
    await exportToExcel(data, "Customer Data", "customer_data.xlsx");
  };

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    error,
    loading,
    fetchEntries,
    deleteEntry,
    exportToExcel: handleExport,
    setError
  };
};

export default useCustomerData;
