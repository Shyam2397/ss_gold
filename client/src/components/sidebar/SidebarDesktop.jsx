import React, { memo, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useSidebar } from './SidebarProvider';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { SidebarMenuContent } from './SidebarMenuContent';
import ErrorBoundary from '../common/ErrorBoundary';
import { useResizeObserver } from '../../hooks/useResizeObserver';

const sidebarVariants = {
  expanded: { width: "260px", transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
  collapsed: { width: "70px", transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }
};

export const SidebarDesktop = memo(({
  user,
  handleLogout,
  handleNavigation,
  mainMenuItems,
  dataMenuItems,
  expenseMenuItems,
  isActive,
  isDataOpen,
  setIsDataOpen,
  isExpensesOpen,
  setIsExpensesOpen,
  onExpenseItemClick,
}) => {
  const { open, setOpen, animate } = useSidebar();
  const expandTimeoutRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const sidebarRef = useResizeObserver(({ width }) => {
    if (!isAnimatingRef.current) {
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    }
  });

  const handleMouseEnter = useCallback(() => {
    if (!animate || isAnimatingRef.current) return;
    clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => setOpen(true), 50);
  }, [animate, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!animate) return;
    clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, [animate, setOpen]);

  useEffect(() => () => clearTimeout(expandTimeoutRef.current), []);

  const sidebarTransition = useMemo(() => ({
    type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1],
    onStart: () => { isAnimatingRef.current = true; },
    onComplete: () => { isAnimatingRef.current = false; }
  }), []);

  const contentStyle = useMemo(() => ({
    willChange: 'width', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'subpixel-antialiased'
  }), []);

  return (
    <motion.div
      ref={sidebarRef}
      className={cn("h-screen border-r border-gray-200 hidden md:flex md:flex-col bg-white overflow-hidden transform-gpu")}
      style={contentStyle}
      variants={sidebarVariants}
      animate={open ? "expanded" : "collapsed"}
      initial={false}
      transition={sidebarTransition}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader />
      <ErrorBoundary>
        <div className="flex-1 flex flex-col min-h-0">
          <SidebarMenuContent {...{ mainMenuItems, dataMenuItems, expenseMenuItems, user, isActive, handleNavigation, isDataOpen, setIsDataOpen, isExpensesOpen, setIsExpensesOpen, onExpenseItemClick }} />
          <SidebarFooter handleLogout={handleLogout} handleNavigation={handleNavigation} />
        </div>
      </ErrorBoundary>
    </motion.div>
  );
});