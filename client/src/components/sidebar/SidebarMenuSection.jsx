import React, { memo } from 'react';

export const SidebarMenuSection = memo(({ children }) => (
  <div className="py-0.5">
    <nav className="space-y-1 px-3.5">{children}</nav>
  </div>
));