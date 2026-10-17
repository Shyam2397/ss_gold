const TextField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", id, disabled, compact = false }) => (
  <div>
    <label htmlFor={id} className={`flex items-center font-medium text-amber-900 ${compact ? "mb-1 text-xs" : "mb-1.5 text-sm"}`}>
      {Icon && <Icon className={`mr-1.5 text-amber-600 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all disabled:bg-amber-50 disabled:text-amber-500 ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
    />
  </div>
);

export default TextField;
