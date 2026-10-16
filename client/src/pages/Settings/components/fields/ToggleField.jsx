const ToggleField = ({ label, icon: Icon, value, onChange, description }) => (
  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100">
    <div className="flex items-start">
      {Icon && <Icon className="w-5 h-5 mr-2 mt-0.5 text-amber-600" />}
      <div>
        <p className="text-sm font-medium text-amber-900">{label}</p>
        {description && <p className="text-xs text-amber-600 mt-0.5">{description}</p>}
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
        value ? "bg-amber-600" : "bg-amber-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default ToggleField;
