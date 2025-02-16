import React from 'react';

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
    // Replaced motion.div with standard div to eliminate animation
    <div
      className="p-6 sm:p-8 bg-gradient-to-br from-[#F9F3F1] to-[#FFF8F0] shadow-lg rounded-xl max-w-full h-full text-[#391145]"
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
    </div>
  );
};

export default CustomerDataPage;
