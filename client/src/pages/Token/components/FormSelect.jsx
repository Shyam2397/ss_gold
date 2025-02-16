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
  icon: Icon = FiClipboard
}) => (
  <div className="relative rounded-md shadow-sm">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      {Icon && <Icon className="h-5 w-5 text-amber-600" aria-hidden="true" />}
    </div>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <FiChevronDown className="h-4 w-4 text-amber-600" aria-hidden="true" />
    </div>
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className={`
        w-full
        rounded-md
        border
        border-amber-200
        bg-white
        pl-10
        pr-10
        shadow-sm
        focus:border-amber-500
        focus:outline-none
        focus:ring-1
        focus:ring-amber-500
        py-2 text-sm
        text-amber-900
        appearance-none
      `}
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
    <label
      htmlFor={id}
      className="absolute -top-2 left-2 -mt-px inline-block bg-white px-1 text-xs font-medium text-amber-900"
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center">
        <FiAlertCircle className="mr-1 h-3.5 w-3.5" />
        {error}
      </p>
    )}
  </div>
);

export default FormSelect;
