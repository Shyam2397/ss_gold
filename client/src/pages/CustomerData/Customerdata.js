import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

import CustomerDataHeader from "./components/CustomerDataHeader";
import CustomerDataError from "./components/CustomerDataError";
import CustomerDataLoader from "./components/CustomerDataLoader";
import CustomerDataTable from "./components/CustomerDataTable";

const API_URL = process.env.REACT_APP_API_URL;

const Customerdata = () => {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
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
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/entries/${id}`);
      setEntries(entries.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError("Failed to delete entry. Please try again.");
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(entries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");
    XLSX.writeFile(workbook, "customer_data.xlsx");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-xl rounded-2xl max-w-full h-full text-[#391145]"
    >
      <CustomerDataHeader entries={entries} onExport={exportToExcel} />
      <CustomerDataError error={error} />
      
      {loading ? (
        <CustomerDataLoader />
      ) : (
        <CustomerDataTable 
          entries={entries} 
          onDelete={handleDelete} 
        />
      )}
    </motion.div>
  );
};

export default Customerdata;
