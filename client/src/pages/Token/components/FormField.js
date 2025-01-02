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
  <div className="form-control w-full">
    <label className="block text-sm font-medium text-amber-900 mb-1">
      {label}
    </label>
    <div className="relative rounded-md shadow-sm">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-amber-400" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        step={step}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
          readOnly ? "bg-amber-50" : ""
        }`}
      />
    </div>
  </div>
);

export default FormField;
