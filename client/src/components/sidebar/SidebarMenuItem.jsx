import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useSidebar } from './SidebarProvider';

export const SidebarMenuItem = memo(({ icon: Icon, label, to, isActive, onClick, handleNavigation }) => {
  const { open, mobileOpen } = useSidebar();
  const reduceMotion = useReducedMotion();
  // Labels are shown when the desktop sidebar is expanded OR the mobile drawer
  // is open - the two viewports own independent open states.
  const labelsVisible = open || mobileOpen;
  const title = !labelsVisible ? label || undefined : undefined;

  const labelVariants = useMemo(() => {
    const duration = reduceMotion ? 0 : 0.2;
    return {
      visible: { opacity: 1, display: "block", transition: { duration } },
      hidden: { opacity: 0, display: "none", transition: { duration } }
    };
  }, [reduceMotion]);

  const content = (
    <>
      <div className="flex items-center justify-center w-5 pl-1"><Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-gold-bright")} /></div>
      <motion.span variants={labelVariants} animate={labelsVisible ? "visible" : "hidden"} className="font-medium text-base ml-3 whitespace-nowrap">{label}</motion.span>
    </>
  );

  const itemClassName = cn(
    "flex items-center h-9 px-2 rounded-xl transition-all duration-200 motion-reduce:transition-none",
    "relative group",
    isActive
      ? "bg-gold-bright/15 text-gold-bright font-semibold"
      : "text-white/60 hover:bg-white/5 hover:text-gold-bright"
  );

  // Items without a route (e.g. Logout) are buttons instead of dead "#" anchors.
  if (!to) {
    return (
      <button
        type="button"
        title={title}
        aria-label={label || undefined}
        onClick={onClick}
        className={itemClassName}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={to}
      title={title}
      aria-label={label || undefined} // Keep the item named when the label is display:none
      aria-current={isActive ? 'page' : undefined}
      onClick={(e) => {
        // When handleNavigation is present it calls navigate() itself, so stop
        // the Link from following through or the route would be entered twice.
        if (handleNavigation) e.preventDefault();
        if (onClick) onClick();
        if (handleNavigation) handleNavigation(to);
      }}
      className={itemClassName}
    >
      {content}
    </Link>
  );
});