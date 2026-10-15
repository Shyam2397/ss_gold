const NumberField = ({ label, icon: Icon, value, onChange, min = 1, max = 99 }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
      {Icon && <Icon className="w-4 h-4 mr-1.5 text-amber-600" />}
      {label}
    </label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 1)))}
      className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm"
    />
  </div>
);

export default NumberField;
