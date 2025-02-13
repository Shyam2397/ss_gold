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
  <div className="space-y-1.5">
    <label 
      className="text-sm font-medium text-amber-900 flex items-center"
    >
      {Icon && (
        <span className="mr-1.5">
          <Icon className="h-4 w-4 text-amber-600" />
        </span>
      )}
      {label}
      {required && <span className="text-red-500 ml-0.5 text-[10px]">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        step={step}
        className="block w-full px-2.5 py-1.5 text-sm rounded border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-amber-800"
      />
    </div>
  </div>
);

export default FormField;
