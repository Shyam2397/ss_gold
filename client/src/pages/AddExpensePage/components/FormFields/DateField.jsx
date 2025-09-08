import React from 'react';
import { FiCalendar } from 'react-icons/fi';

const DateField = ({ value, onChange }) => (
  <div className="relative">
    <label htmlFor="date" className="block text-xs font-medium text-amber-700 mb-1.5">
      Date <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-9">
        <FiCalendar className="h-4 w-4 text-amber-500" />
      </div>
      <input
        type="date"
        name="date"
        id="date"
        value={value}
        onChange={onChange}
        className="block w-full pl-9 pr-3 py-1.5 h-9 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
        required
      />
    </div>
  </div>
);

export default DateField;
