const NumberField = ({ label, icon: Icon, value, onChange, min = 1, max = 99, compact = false }) => (
  <div>
    <label className={`flex items-center font-medium text-amber-900 ${compact ? "mb-1 text-xs" : "mb-1.5 text-sm"}`}>
      {Icon && <Icon className={`mr-1.5 text-amber-600 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
      {label}
    </label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const parsed = Number(e.target.value);
        const next = Number.isFinite(parsed) ? parsed : min;
        onChange(Math.max(min, Math.min(max, next)));
      }}
      className={`w-full rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
    />
  </div>
);

export default NumberField;
