import React from 'react';
import { motion } from 'framer-motion';

import useCustomerData from './hooks/useCustomerData';
import CustomerDataHeader from './components/CustomerDataHeader';
import CustomerDataError from './components/CustomerDataError';
import CustomerDataLoader from './components/CustomerDataLoader';
import CustomerDataTable from './components/CustomerDataTable';

const CustomerDataPage = () => {
  const { 
    entries, 
    error, 
    loading, 
    deleteEntry, 
    exportToExcel 
  } = useCustomerData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-xl rounded-2xl max-w-full h-full text-[#391145]"
    >
      <CustomerDataHeader entries={entries} onExport={exportToExcel} />
      <CustomerDataError error={error} />
      
      {loading ? (
        <CustomerDataLoader />
      ) : (
        <CustomerDataTable 
          entries={entries} 
          onDelete={deleteEntry} 
        />
      )}
    </motion.div>
  );
};

export default CustomerDataPage;
