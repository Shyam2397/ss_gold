import React from 'react';
import { motion } from 'framer-motion';

const CustomerDataError = ({ error }) => {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r"
    >
      {error}
    </motion.div>
  );
};

export default CustomerDataError;
