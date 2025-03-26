import React from 'react';

const MenuSection = React.memo(({ children }) => (
  <div className="py-0.5">
    <nav className="space-y-1 px-3.5">{children}</nav>
  </div>
));

export default MenuSection;
