import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error = '',
  readOnly = false,
  size = 'base',
  icon = null
}) => {
  const sizeClasses = {
    sm: 'py-1.5 text-xs',
    base: 'py-1.5 text-sm',
    lg: 'py-1.5 text-sm'
  };

  return (
    <div className="space-y-1.5">
      <label 
        htmlFor={name} 
        className="text-sm font-medium text-amber-900 flex items-center"
      >
        {icon && React.createElement(icon, { 
          className: "h-4 w-4 text-amber-600 mr-1.5" 
        })}
        {label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        {error && <span className="text-red-500 ml-0.5"><FiAlertCircle className="inline h-3.5 w-3.5" /></span>}
      </label>
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`
            block w-full 
            px-2.5
            ${sizeClasses[size]} 
            rounded 
            border border-amber-200 
            focus:ring-1 focus:ring-amber-500 
            focus:border-amber-500 
            transition-all
            text-amber-800
            ${readOnly ? 'bg-gray-50' : ''}
            ${error ? 'border-red-500' : ''}
          `}
        />
      </div>
    </div>
  );
};

export default FormInput;
