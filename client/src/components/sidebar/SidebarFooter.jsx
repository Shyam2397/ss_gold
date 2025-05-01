import React, { memo } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useSidebar } from './SidebarProvider';

export const SidebarFooter = memo(({ handleLogout, handleNavigation }) => {
  const { open } = useSidebar();

  return (
    <div className="border-t border-amber-100 flex-shrink-0 mt-0.5 px-3.5 py-1">
      <SidebarMenuItem
        icon={FiLogOut}
        label={open ? "Logout" : ""}
        onClick={handleLogout}
        handleNavigation={handleNavigation} // Pass handleNavigation if needed, though onClick handles it here
      />
    </div>
  );
});