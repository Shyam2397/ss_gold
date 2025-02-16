import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';
import { exportToExcel } from '../../../utils/excelExport';

const ExportButton = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    if (!data || data.length === 0) {
      console.error('No data available for export');
      return;
    }

    setIsExporting(true);
    try {
      // Transform the data to match the actual data structure
      const transformedData = data.map(token => {
        return {
          'Token No.': token.tokenNo,
          'Date': token.date,
          'Time': token.time,
          'Code': token.code,
          'Name': token.name,
          'Sample': token.sample,
          'Test': token.test,
          'Weight': token.weight,
          'Amount': token.amount,
          'Is Paid': token.isPaid
        };
      });
      await exportToExcel(transformedData, "Token Data", "token_data.xlsx");
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleExport}
      disabled={isExporting || !data || data.length === 0}
      className="flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-70"
    >
      <FiDownload className="h-4.5 w-4.5" />
      {isExporting ? 'Exporting...' : 'Export to Excel'}
    </motion.button>
  );
};

export default ExportButton;
