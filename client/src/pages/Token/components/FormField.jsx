import React from 'react';

const FormField = ({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  readOnly = false,
  required = false,
  step,
}) => (
  <div className="space-y-2 sm:space-y-3">
    <label 
      className="text-base sm:text-lg font-medium text-amber-900 flex items-center"
    >
      {Icon && (
        <span className="mr-2 sm:mr-3">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
        </span>
      )}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        step={step}
        className="block w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-2.5 sm:py-3 text-base sm:text-lg rounded-xl border-2 border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-amber-800"
      />
    </div>
  </div>
);

export default FormField;
