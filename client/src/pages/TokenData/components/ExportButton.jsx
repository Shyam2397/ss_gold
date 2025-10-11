import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';
import { exportToExcel } from '../../../utils/excelExport';

// Function to sort data by token number in alphanumeric order (A1, A2, A3, ..., B1, B2, B3, ...)
const sortByTokenNo = (data) => {
  if (!data || !Array.isArray(data)) return data;
  
  // Create a copy of the data to avoid mutating the original
  return [...data].sort((a, b) => {
    // Extract token numbers
    const tokenA = a.tokenNo || a.token_no || '';
    const tokenB = b.tokenNo || b.token_no || '';
    
    // Split token into letter and number parts
    const matchA = tokenA.match(/^([A-Z]+)(\d+)$/i);
    const matchB = tokenB.match(/^([A-Z]+)(\d+)$/i);
    
    // If both tokens follow the pattern (letter followed by number)
    if (matchA && matchB) {
      const letterA = matchA[1].toUpperCase();
      const numberA = parseInt(matchA[2], 10);
      const letterB = matchB[1].toUpperCase();
      const numberB = parseInt(matchB[2], 10);
      
      // First compare by letter
      if (letterA !== letterB) {
        return letterA.localeCompare(letterB);
      }
      
      // If same letter, compare by number
      return numberA - numberB;
    }
    
    // If one or both don't follow the pattern, fall back to string comparison
    return tokenA.toString().localeCompare(tokenB.toString());
  });
};

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
      // Sort data by token number for export only
      const sortedData = sortByTokenNo(data);
      
      // Transform the data to match the actual data structure
      const transformedData = sortedData.map(token => {
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
