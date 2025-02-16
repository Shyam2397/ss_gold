import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';

const CustomerDataHeader = ({ entries, onExport }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-5 pb-3 border-b-2 border-[#D3B04D]">
      <h1 className="text-3xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
        Customer Data
      </h1>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleExport}
        disabled={isExporting || !entries || entries.length === 0}
        className="flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70"
      >
        <FiDownload className="h-4.5 w-4.5" />
        {isExporting ? 'Exporting...' : 'Export to Excel'}
      </motion.button>
    </div>
  );
};

export default CustomerDataHeader;
