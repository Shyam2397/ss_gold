import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiTrash2,
  FiCalendar,
  FiX,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";

const DateInput = ({ label, value, onChange }) => (
  <div className="flex items-center gap-4">
    <label className="text-sm font-medium text-amber-900 whitespace-nowrap">
      {label}
    </label>
    <div className="relative flex-1">
      <div className="relative rounded-md shadow-sm cursor-pointer">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          <FiCalendar className="h-5 w-5 text-amber-400" />
        </div>
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="pl-10 pr-4 py-2 w-full rounded-lg border-2 border-amber-200 
                   focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                   bg-white hover:border-amber-300 transition-all duration-200
                   cursor-pointer"
          onClick={(e) => {
            e.currentTarget.showPicker();
          }}
        />
      </div>
    </div>
  </div>
);

const Tokendata = () => {
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
        `${process.env.REACT_APP_API_URL}/tokens`
      );
      setTokens(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setError("Failed to fetch tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterTokensByDate = useCallback(() => {
    if (!fromDate && !toDate) {
      setFilteredTokens(tokens);
      return;
    }

    const filtered = tokens.filter((token) => {
      const tokenDate = new Date(token.date);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

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

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    filterTokensByDate();
  }, [fromDate, toDate, tokens, filterTokensByDate]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTokens);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Token Data");
    XLSX.writeFile(workbook, "token_data.xlsx");
  };

  const handleDelete = async (tokenId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/tokens/${tokenId}`);
      setTokens(tokens.filter((token) => token.id !== tokenId));
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-xl rounded-2xl max-w-full h-full text-[#391145]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-4 border-[#D3B04D]">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
          Token Data
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
          className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-center space-x-2"
        >
          <FiAlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <DateInput
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <div className="pl-10">
            <DateInput
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearDates}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors duration-200"
          >
            <FiX className="h-5 w-5" />
            Clear Dates
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FiLoader className="h-8 w-8 text-[#D3B04D] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[450px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-[#DD845A] to-[#D3B04D]">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Token No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white max-[600px]:hidden">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white max-[600px]:hidden">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white max-[600px]:hidden">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white hidden md:table-cell">
                      Test
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white hidden md:table-cell">
                      Weight
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white hidden md:table-cell">
                      Sample
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white hidden md:table-cell">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {filteredTokens.map((token, index) => (
                    <motion.tr
                      key={token.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-amber-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        {token.tokenNo}
                        <dl className="sm:hidden mt-1">
                          <dd className="text-sm text-gray-600">
                            {token.date}
                          </dd>
                          <dd className="text-sm text-gray-600">
                            {token.time}
                          </dd>
                          <dd className="text-sm text-gray-600">
                            {token.code}
                          </dd>
                        </dl>
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap max-[600px]:hidden">
                        {token.date}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap max-[600px]:hidden">
                        {token.time}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap max-[600px]:hidden">
                        {token.code}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap font-medium">
                        {token.name}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap hidden md:table-cell">
                        {token.test}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap hidden md:table-cell">
                        {token.weight}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap hidden md:table-cell">
                        {token.sample}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap hidden md:table-cell">
                        {token.amount}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(token.id)}
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

export default Tokendata;
