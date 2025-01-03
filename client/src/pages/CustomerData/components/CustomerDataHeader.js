import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';

const CustomerDataHeader = ({ entries, onExport }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-4 border-[#D3B04D]">
      <h1 className="text-4xl font-bold mb-4 sm:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#391145] to-[#D3B04D]">
        Customer Data
      </h1>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onExport}
        className="flex items-center gap-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
      >
        <FiDownload className="h-5 w-5" />
        Export to Excel
      </motion.button>
    </div>
  );
};

export default CustomerDataHeader;
