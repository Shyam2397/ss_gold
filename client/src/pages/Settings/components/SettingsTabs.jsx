const SettingsTabs = ({ tabs, activeTab, onSelect }) => {
  const handleKeyDown = (e) => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    let next = null;
    if (e.key === "ArrowRight") next = tabs[(idx + 1) % tabs.length].id;
    if (e.key === "ArrowLeft") next = tabs[(idx - 1 + tabs.length) % tabs.length].id;
    if (next) {
      e.preventDefault();
      onSelect(next);
    }
  };

  return (
    <div className="mb-6">
      <div
        role="tablist"
        aria-label="Settings sections"
        onKeyDown={handleKeyDown}
        className="flex flex-wrap gap-1 rounded-2xl border border-amber-100 bg-amber-50/60 p-1.5 shadow-sm sm:flex-nowrap"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-settings-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={`group flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-md shadow-amber-200"
                  : "text-amber-600 hover:bg-amber-100 hover:text-amber-800"
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{tab.label}</span>
                <span className={`block truncate text-xs ${isActive ? "text-amber-100" : "text-amber-500"}`}>
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsTabs;
