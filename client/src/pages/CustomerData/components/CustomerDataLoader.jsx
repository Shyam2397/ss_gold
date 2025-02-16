import React from 'react';
import { FiLoader } from 'react-icons/fi';

const CustomerDataLoader = () => (
  <div className="flex items-center justify-center h-56">
    <FiLoader className="h-7 w-7 text-[#D3B04D] animate-spin" />
  </div>
);

export default CustomerDataLoader;
