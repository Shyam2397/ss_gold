import React from 'react';
import { FiChevronDown, FiAlertCircle } from 'react-icons/fi';

const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  id, 
  required, 
  placeholder, 
  error, 
  icon 
}) => (
  <div className="space-y-2 sm:space-y-3">
    <label 
      htmlFor={id} 
      className="text-base sm:text-lg font-medium text-amber-700 flex items-center"
    >
      {icon && (
        <span className="mr-2 sm:mr-3">
          {React.createElement(icon, { 
            className: "h-5 w-5 sm:h-6 sm:w-6 text-amber-600" 
          })}
        </span>
      )}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className="block w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-2.5 sm:py-3 text-base sm:text-lg rounded-xl border-2 border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 appearance-none text-amber-800"
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
            className="text-base sm:text-lg"
          >
            {option}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-amber-700">
        <FiChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
      </div>
    </div>
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center">
        <FiAlertCircle className="mr-2 h-4 w-4" />
        {error}
      </p>
    )}
  </div>
);

export default FormSelect;
