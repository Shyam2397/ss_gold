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
    sm: 'py-1.5 text-sm',
    base: 'py-1.5 sm:py-2.5 text-sm sm:text-base',
    lg: 'py-1.5 sm:py-2.5 text-base sm:text-lg'
  };

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label 
        htmlFor={name} 
        className="text-sm sm:text-base font-medium text-amber-900 flex items-center"
      >
        {icon && React.createElement(icon, { 
          className: "h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mr-2 sm:mr-3" 
        })}
        {label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        {error && <span className="text-red-500 ml-1.5"><FiAlertCircle className="inline h-4 w-4" /></span>}
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
            pl-3 sm:pl-4 
            pr-8 sm:pr-10 
            ${sizeClasses[size]} 
            rounded-lg 
            border border-amber-200 
            focus:ring-1 focus:ring-amber-500 
            focus:border-amber-500 
            transition-all duration-200
            text-amber-800
            ${readOnly ? 'bg-amber-50 cursor-not-allowed' : ''}
          `}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <FiAlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <FiAlertCircle className="mr-1.5 h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
