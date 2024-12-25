import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { FiDownload, FiTrash2, FiLoader } from "react-icons/fi";

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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-4 border-[#D3B04D]">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
          Customer Data
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          <FiDownload className="h-5 w-5" />
          Export to Excel
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r"
        >
          {error}
        </motion.div>
      )}

      <div className="mt-4 bg-white rounded-2xl shadow-inner overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FiLoader className="h-8 w-8 text-[#D3B04D] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[450px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D] text-white">
                    <th className="px-6 py-4 text-left font-semibold">Name</th>
                    <th className="px-6 py-4 text-left font-semibold hidden sm:table-cell">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-left font-semibold hidden sm:table-cell">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left font-semibold hidden sm:table-cell">
                      Place
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {entries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-amber-100 hover:bg-amber-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-3 whitespace-nowrap font-medium">
                        {entry.name}
                        <dl className="sm:hidden mt-1">
                          <dd className="text-sm text-gray-600">
                            {entry.phoneNumber}
                          </dd>
                          <dd className="text-sm text-gray-600">
                            {entry.code}
                          </dd>
                          <dd className="text-sm text-gray-600">
                            {entry.place}
                          </dd>
                        </dl>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        {entry.phoneNumber}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        {entry.code}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        {entry.place}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Customerdata;
