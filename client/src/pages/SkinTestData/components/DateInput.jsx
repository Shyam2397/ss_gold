import React from 'react';
import { FiCalendar } from 'react-icons/fi';

const DateInput = ({ label, value, onChange }) => (
  <div className="flex items-center gap-4">
    <label className="text-sm font-medium text-amber-900 whitespace-nowrap">
      {label}
    </label>
    <div className="relative flex-1">
      <div className="relative rounded-md shadow-sm cursor-pointer">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          <FiCalendar className="h-5 w-5 text-amber-400" />
        </div>
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="pl-10 pr-4 py-2 w-full rounded-lg border-2 border-amber-200 
                   focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                   bg-white hover:border-amber-300 transition-all duration-200
                   cursor-pointer"
          onClick={(e) => {
            e.currentTarget.showPicker();
          }}
        />
      </div>
    </div>
  </div>
);

export default DateInput;
