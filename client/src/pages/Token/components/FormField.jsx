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
  <div className="relative rounded-md shadow-sm">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      {Icon && <Icon className="h-5 w-5 text-amber-600" aria-hidden="true" />}
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      step={step}
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
        ${readOnly ? 'bg-gray-50' : ''}
        py-2 text-sm
        text-amber-900
      `}
      aria-label={label}
    />
    <label
      className="absolute -top-2 left-2 -mt-px inline-block bg-white px-1 text-xs font-medium text-amber-900"
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  </div>
);

export default React.memo(FormField, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.readOnly === nextProps.readOnly;
});
