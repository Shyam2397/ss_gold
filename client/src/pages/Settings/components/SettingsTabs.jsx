import { useRef } from "react";

const SettingsTabs = ({ tabs, activeTab, onSelect }) => {
  const listRef = useRef(null);

  // Move DOM focus onto the tab a keyboard user just navigated to, so the
  // roving tabIndex and the visual selection stay in sync.
  const focusTab = (id) => {
    const nodes = listRef.current?.querySelectorAll('[role="tab"]');
    if (!nodes) return;
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx >= 0) nodes[idx]?.focus();
  };

  const handleKeyDown = (e) => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    let nextId = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextId = tabs[(idx + 1) % tabs.length].id;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextId = tabs[(idx - 1 + tabs.length) % tabs.length].id;
    } else if (e.key === "Home") {
      nextId = tabs[0].id;
    } else if (e.key === "End") {
      nextId = tabs[tabs.length - 1].id;
    }
    if (nextId) {
      e.preventDefault();
      onSelect(nextId);
      focusTab(nextId);
    }
  };

  return (
    <div className="mb-6">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Settings sections"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 gap-1.5 rounded-2xl border border-amber-100 bg-amber-50/60 p-1.5 shadow-sm sm:grid-cols-3 lg:grid-cols-6"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const spansLastOnMobile = index === tabs.length - 1 && tabs.length % 2 === 1;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-settings-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={`group flex min-w-0 items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:px-4 sm:py-3 ${
                spansLastOnMobile ? "col-span-2 sm:col-span-1" : ""
              } ${
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
