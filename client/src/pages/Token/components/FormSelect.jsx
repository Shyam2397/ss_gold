import React from 'react';

const FormSelect = ({ label, value, onChange, options }) => (
  <div className="form-control w-full">
    <label className="block text-sm font-medium text-amber-900 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full pl-4 pr-10 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default FormSelect;
