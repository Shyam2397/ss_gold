import React from 'react';

import { useCustomerData } from './hooks/useCustomerData';
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
      className="p-6 sm:p-8 bg-white shadow-lg rounded-xl max-w-full h-full text-[#391145] m-4"
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
