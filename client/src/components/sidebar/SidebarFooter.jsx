import React, { memo } from 'react';
import { SidebarMenuItem } from './SidebarMenuItem';
import { Icons } from './SidebarIcons';

export const SidebarFooter = memo(({ handleLogout, handleNavigation }) => {
  return (
    <div className="border-t border-amber-100 flex-shrink-0 mt-0.5 px-3.5 py-1">
      <SidebarMenuItem
        icon={Icons.LogOut}
        label="Logout"
        onClick={handleLogout}
        handleNavigation={handleNavigation} // Pass handleNavigation if needed, though onClick handles it here
      />
    </div>
  );
});