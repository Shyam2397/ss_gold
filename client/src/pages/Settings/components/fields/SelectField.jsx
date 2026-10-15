const SelectField = ({ label, icon: Icon, value, onChange, options, disabled, description }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
      {Icon && <Icon className="w-4 h-4 mr-1.5 text-amber-600" />}
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm disabled:bg-amber-50 disabled:text-amber-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {description && (
      <p className="text-xs text-amber-600 mt-1">{description}</p>
    )}
  </div>
);

export default SelectField;
