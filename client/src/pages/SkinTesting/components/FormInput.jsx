import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

// forwardRef so the page can drive focus between fields (token -> highest)
// without this component needing to know anything about form flow.
const FormInput = React.forwardRef(function FormInput(
  {
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    error = '',
    readOnly = false,
    size = 'base',
    icon: Icon = null
  },
  ref
) {
  const baseClasses = `
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
    ${size === 'base' ? 'py-2 text-sm' : 'py-1 text-xs'}
    ${error ? 'border-red-500' : ''}
    text-amber-900
  `;

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {Icon && <Icon className={`${size === 'base' ? 'h-5 w-5' : 'h-4 w-4'} text-amber-600`} aria-hidden="true" />}
      </div>
      <input
        ref={ref}
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className={baseClasses}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-label={label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      />
      <label
        htmlFor={name}
        className="absolute -top-2 left-2 -mt-px inline-block bg-white px-1 text-xs font-medium text-amber-900"
      >
        {label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        {error && <span className="text-red-500 ml-0.5"><FiAlertCircle className="inline h-3.5 w-3.5" /></span>}
      </label>
    </div>
  );
});

// `onChange` is intentionally left out of the comparison: every handler the
// page passes down is memoized, and including it would defeat the memo.
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.name === nextProps.name
  );
};

export default React.memo(FormInput, areEqual);
