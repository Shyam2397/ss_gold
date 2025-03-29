import React from 'react';

const FormField = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = true,
  type = "text"
}) => (
  <div className="relative rounded-md shadow-sm">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      {Icon && <Icon className="h-5 w-5 text-amber-600" aria-hidden="true" />}
    </div>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`
        w-full
        rounded-md
        border
        border-amber-200
        bg-white
        pl-10
        shadow-sm
        focus:border-amber-500
        focus:outline-none
        focus:ring-1
        focus:ring-amber-500
        py-2 text-sm
        text-amber-900
      `}
      aria-label={label}
    />
    <label
      htmlFor={id}
      className="absolute -top-2 left-2 -mt-px inline-block bg-white px-1 text-xs font-medium text-amber-900"
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  </div>
);

export default FormField;
