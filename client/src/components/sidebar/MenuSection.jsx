import React from 'react';

const MenuSection = ({ title, children }) => (
  <div className="py-4">
    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
      {title}
    </h3>
    <nav className="space-y-1">{children}</nav>
  </div>
);

export default MenuSection;
