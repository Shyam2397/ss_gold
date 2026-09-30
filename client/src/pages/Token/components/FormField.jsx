import React from 'react';

let fieldCounter = 0;

const FormField = ({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  readOnly = false,
  required = false,
  step,
  name,
  placeholder,
  inputRef,
  id,
}) => {
  // The floating label needs to point at a real input, so generate a stable id
  // when the caller does not supply one.
  const generatedId = React.useMemo(() => {
    fieldCounter += 1;
    return `token-field-${fieldCounter}`;
  }, []);
  const inputId = id || generatedId;

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {Icon && <Icon className="h-5 w-5 text-amber-600" aria-hidden="true" />}
      </div>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        step={step}
        placeholder={placeholder}
        ref={inputRef}
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
      />
      <label
        htmlFor={inputId}
        className="absolute -top-2 left-2 -mt-px inline-block bg-white px-1 text-xs font-medium text-amber-900"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
    </div>
  );
};

// Compare every prop that affects the rendered output. The previous comparator
// only checked value/readOnly/onChange, so a change to label, type, step,
// placeholder or the ref was silently ignored.
export default React.memo(FormField, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.label === nextProps.label &&
    prevProps.type === nextProps.type &&
    prevProps.step === nextProps.step &&
    prevProps.name === nextProps.name &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.required === nextProps.required &&
    prevProps.icon === nextProps.icon &&
    prevProps.id === nextProps.id &&
    prevProps.inputRef === nextProps.inputRef
  );
});
