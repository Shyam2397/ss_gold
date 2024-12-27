import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const ExportButton = ({ data }) => {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Token Data");
    XLSX.writeFile(workbook, "token_data.xlsx");
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={exportToExcel}
      className="flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
    >
      <FiDownload className="h-5 w-5" />
      Export to Excel
    </motion.button>
  );
};

export default ExportButton;
