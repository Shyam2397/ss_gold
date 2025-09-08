import React from 'react';
import { FiCreditCard } from 'react-icons/fi';

const PaymentModeField = ({ value, onChange }) => (
  <div className="relative">
    <label htmlFor="payMode" className="block text-xs font-medium text-amber-700 mb-1.5">
      Payment Mode
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-9">
        <FiCreditCard className="h-4 w-4 text-amber-500" />
      </div>
      <select
        id="payMode"
        name="payMode"
        value={value}
        onChange={onChange}
        className="block w-full pl-9 pr-8 py-1.5 h-9 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white appearance-none transition-colors"
      >
        <option value="">Select payment mode</option>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="upi">UPI</option>
        <option value="other">Other</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
);

export default PaymentModeField;
