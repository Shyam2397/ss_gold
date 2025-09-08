import React from 'react';

const AmountField = ({ value, onChange }) => (
  <div className="relative">
    <label htmlFor="amount" className="block text-xs font-medium text-amber-700 mb-1.5">
      Amount <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-9">
        <span className="text-amber-600 font-medium text-sm">₹</span>
      </div>
      <input
        type="number"
        name="amount"
        id="amount"
        value={value}
        onChange={onChange}
        className="block w-full pl-10 pr-3 py-1.5 h-9 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
        placeholder="0.00"
        min="0"
        step="0.01"
        required
      />
    </div>
  </div>
);

export default AmountField;
