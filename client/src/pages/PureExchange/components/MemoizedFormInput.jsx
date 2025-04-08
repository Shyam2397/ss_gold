import React from 'react';

const FormInput = ({ label, name, value, onChange, readOnly = false, className }) => {
    return (
        <div className={`form-control ${className}`}>
            <label className="block text-xs font-medium text-amber-900 mb-0.5">
                {label}
            </label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full px-2 py-1 text-sm rounded border border-amber-200 border-solid focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-amber-900 transition-all duration-200${readOnly ? 'bg-gray-50' : ''}`}
            />
        </div>
    );
};

// Memoization comparison function
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.value === nextProps.value &&
        prevProps.readOnly === nextProps.readOnly &&
        prevProps.className === nextProps.className
    );
};

export default React.memo(FormInput, areEqual);