const ColorField = ({ label, icon: Icon, value, onChange, description, compact = false }) => (
  <div>
    <label className={`flex items-center font-medium text-amber-900 ${compact ? "mb-1 text-xs" : "mb-1.5 text-sm"}`}>
      {Icon && <Icon className={`mr-1.5 text-amber-600 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color picker`}
        className={`${compact ? "h-7 w-10 p-0.5" : "h-9 w-12 p-1"} flex-shrink-0 cursor-pointer rounded-lg border border-amber-200 bg-white`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`w-full rounded-lg border border-amber-200 bg-white uppercase text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
      />
    </div>
    {description && <p className={`text-amber-600 mt-1 ${compact ? "text-[11px]" : "text-xs"}`}>{description}</p>}
  </div>
);

export default ColorField;
