import React from 'react';
import { FiLoader } from 'react-icons/fi';

const CustomerDataLoader = () => (
  <div className="flex items-center justify-center h-64">
    <FiLoader className="h-8 w-8 text-[#D3B04D] animate-spin" />
  </div>
);

export default CustomerDataLoader;
