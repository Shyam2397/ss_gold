import React from 'react';
import { metalFields } from '../constants/initialState';

const FormInput = ({ label, name, value, onChange, readOnly = false }) => {
  const isMetalField = metalFields.includes(name);

  return (
    <div className="form-control w-full">
      <label className="block text-sm font-medium text-amber-900 mb-1">
        {label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </label>
      <div className="relative rounded-md shadow-sm">
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`w-full pl-4 pr-10 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
            readOnly ? "bg-gray-50" : ""
          } ${isMetalField ? "bg-amber-50" : ""}`}
        />
        {isMetalField && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormInput;
