import { useState, useCallback, useEffect } from "react";
import { exportToExcel } from '../../../utils/excelExport';
import entryService from '../../../services/entryService';

// Custom hook for managing customer data
export const useCustomerData = () => {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await entryService.getEntries();
      // Sort entries alphabetically by name
      const sortedData = [...data].sort((a, b) => 
        a.name.localeCompare(b.name, 'en', {sensitivity: 'base'})
      );
      setEntries(sortedData);
      setError("");
    } catch (error) {
      console.error("Error fetching entries:", error);
      setError(error.response?.data?.error || "Failed to fetch entries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    try {
      await entryService.deleteEntry(id);
      setEntries(currentEntries => 
        currentEntries.filter((entry) => entry.id !== id)
      );
      setError("");
      return { success: true };
    } catch (error) {
      console.error("Error deleting entry:", error);
      const errorMessage = error.response?.data?.error || "Failed to delete entry. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
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
