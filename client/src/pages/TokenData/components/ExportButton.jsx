import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';
import { exportToExcel } from '../../../utils/excelExport';

const ExportButton = ({ data }) => {
  const handleExport = async () => {
    await exportToExcel(data, "Token Data", "token_data.xlsx");
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleExport}
      className="flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
    >
      <FiDownload className="h-5 w-5" />
      Export to Excel
    </motion.button>
  );
};

export default ExportButton;
