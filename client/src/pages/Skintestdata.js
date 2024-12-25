import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiCalendar,
  FiX,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { GiTestTubes } from "react-icons/gi";

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

const Skintestdata = () => {
  const [skinTests, setSkinTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchSkinTests();
  }, []);

  useEffect(() => {
    filterTestsByDate();
  }, [fromDate, toDate, skinTests]);

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

  const filterTestsByDate = () => {
    if (!fromDate || !toDate) {
      setFilteredTests(
        [...skinTests].sort(
          (a, b) => parseFloat(b.token_no) - parseFloat(a.token_no)
        )
      );
      return;
    }

    const filtered = skinTests
      .filter((test) => {
        const testDate = new Date(test.date.split("-").reverse().join("-"));
        return testDate >= new Date(fromDate) && testDate <= new Date(toDate);
      })
      .sort((a, b) => parseFloat(b.token_no) - parseFloat(a.token_no));

    setFilteredTests(filtered);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTests);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SkinTest Data");
    XLSX.writeFile(workbook, "skinTest_data.xlsx");
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
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <GiTestTubes className="h-8 w-8 text-amber-500" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
            Skin Test Data
          </h1>
        </div>
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
                    {Object.keys(filteredTests[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-2 text-left text-sm font-semibold text-white first:rounded-tl-lg last:rounded-tr-lg"
                      >
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {filteredTests.map((test, index) => (
                    <motion.tr
                      key={test.token_no}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-amber-50 transition-colors duration-200"
                    >
                      {Object.keys(test).map((key) => (
                        <td
                          key={key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {test[key]}
                        </td>
                      ))}
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

export default Skintestdata;
