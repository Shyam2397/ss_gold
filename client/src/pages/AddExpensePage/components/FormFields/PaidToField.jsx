import React from 'react';
import { FiUser } from 'react-icons/fi';

const PaidToField = ({ value, onChange }) => (
  <div className="relative">
    <label htmlFor="paidTo" className="block text-xs font-medium text-amber-700 mb-1.5">
      Paid To
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-9">
        <FiUser className="h-4 w-4 text-amber-500" />
      </div>
      <input
        type="text"
        name="paidTo"
        id="paidTo"
        value={value}
        onChange={onChange}
        className="block w-full pl-9 pr-3 py-1.5 h-9 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
        placeholder="Enter payee name"
      />
    </div>
  </div>
);

export default PaidToField;
