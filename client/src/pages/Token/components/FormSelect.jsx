import React from 'react';
import { FiAlertCircle, FiChevronDown, FiClipboard } from 'react-icons/fi';

const FormSelect = ({
  label,
  value,
  onChange,
  options,
  id,
  required,
  placeholder,
  error,
  icon = FiClipboard
}) => (
  <div className="space-y-1.5">
    <label 
      htmlFor={id} 
      className="text-sm font-medium text-amber-900 flex items-center"
    >
      {icon && (
        <span className="mr-1.5">
          {React.createElement(icon, { 
            className: "h-4 w-4 text-amber-600" 
          })}
        </span>
      )}
      {label}
      {required && <span className="text-red-500 ml-0.5 text-[10px]">*</span>}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="block w-full pl-2.5 pr-8 py-1.5 text-sm rounded border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all appearance-none text-amber-800 bg-white"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option} 
            value={option}
            className="text-sm"
          >
            {option}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <FiChevronDown className="h-4 w-4 text-amber-500" />
      </div>
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center">
        <FiAlertCircle className="mr-1 h-3.5 w-3.5" />
        {error}
      </p>
    )}
  </div>
);

export default FormSelect;
