import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { exportToExcel } from '../../../utils/excelExport';

const API_URL = import.meta.env.VITE_API_URL;

export const useCustomerData = () => {
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

  const handleExport = async () => {
    try {
      if (!entries || entries.length === 0) {
        setError("No data available to export");
        return;
      }

      const transformedData = entries.map(entry => ({
        'Name': entry.name,
        'Phone Number': entry.phoneNumber,
        'Code': entry.code,
        'Place': entry.place
      }));

      await exportToExcel(transformedData, "Customer Data", "customer_data.xlsx");
    } catch (error) {
      console.error("Error exporting data:", error);
      setError("Failed to export data. Please try again.");
    }
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
