import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useSidebar } from './SidebarProvider';

const labelVariants = {
  visible: {
    opacity: 1,
    display: "block",
    transition: { duration: 0.2 }
  },
  hidden: {
    opacity: 0,
    display: "none",
    transition: { duration: 0.2 }
  }
};

export const SidebarMenuItem = memo(({ icon: Icon, label, to, isActive, onClick, handleNavigation }) => {
  const { open, mobileOpen } = useSidebar();
  // Labels are shown when the desktop sidebar is expanded OR the mobile drawer
  // is open - the two viewports own independent open states.
  const labelsVisible = open || mobileOpen;

  return (
    <Link
      to={to || '#'} // Ensure 'to' is defined, default to '#' if only onClick is used
      title={!labelsVisible ? label || undefined : undefined} // Tooltip when the label is visually hidden
      aria-label={label || undefined} // Keep the item named when the label is display:none
      onClick={(e) => {
        // When handleNavigation is present it calls navigate() itself, so stop
        // the Link from following through or the route would be entered twice.
        if (!to || handleNavigation) e.preventDefault();
        if (onClick) onClick();
        if (to && handleNavigation) handleNavigation(to);
      }}
      className={cn(
        "flex items-center h-8 px-2 rounded-xl transition-all duration-200",
        "relative group",
        isActive ? "bg-amber-100 text-amber-900" : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
      )}
    >
      <div className="flex items-center justify-center w-5 pl-1"><Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-amber-600")} /></div>
      <motion.span variants={labelVariants} animate={labelsVisible ? "visible" : "hidden"} className="font-medium text-md ml-3 whitespace-nowrap">{label}</motion.span>
    </Link>
  );
});