import React, { memo, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useSidebar } from './SidebarProvider';
import { SidebarHeader } from './SidebarHeader';
import { SidebarMenuContent } from './SidebarMenuContent';
import ErrorBoundary from '../common/ErrorBoundary';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import sidebarBG from '../../asset/sidebarBG.png';

export const SidebarDesktop = memo(({
  user,
  handleLogout,
  handleNavigation,
  mainMenuItems,
  dataMenuItems,
  expenseMenuItems,
  canAccessSettings,
  hasAnyDataItem,
  hasAnyExpenseItem,
  isActive,
  isDataOpen,
  setIsDataOpen,
  isExpensesOpen,
  setIsExpensesOpen,
  onExpenseItemClick,
}) => {
  const { open, setOpen, animate } = useSidebar();
  const reduceMotion = useReducedMotion();
  // Only devices with a true hover pointer should auto-expand on hover. On
  // touch tablets/laptops a tap fires mouseenter and would otherwise fling the
  // rail open.
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  // Tablet tier: 768px-1023px keeps the rail, but defaults it to collapsed so
  // it doesn't crowd the content area the way it can on small laptops.
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023.98px)');

  const expandTimeoutRef = useRef(null);
  // Whether the pointer is currently over the rail. Scopes the "just collapsed"
  // grace period to collapses that happen under the cursor (e.g. clicking an
  // item), not collapses caused by the pointer leaving - so hovering back in is
  // always immediate.
  const pointerInsideRef = useRef(false);
  // Timestamp of the last cursor-anchored collapse. A just-clicked sidebar must
  // stay shut: otherwise the hover-expand re-opens it under the cursor the
  // instant the rail shrinks beneath a subsection click.
  const collapsedAtRef = useRef(null);

  useEffect(() => {
    if (!open && pointerInsideRef.current) collapsedAtRef.current = Date.now();
  }, [open]);

  // Collapse once when entering the tablet tier. Deliberately keyed on the tier
  // only, so a user who expands on a tablet keeps it open until they resize.
  const setOpenRef = useRef(setOpen);
  useEffect(() => { setOpenRef.current = setOpen; }, [setOpen]);
  useEffect(() => {
    if (isTablet) setOpenRef.current(false);
  }, [isTablet]);

  const handleMouseEnter = useCallback(() => {
    pointerInsideRef.current = true;
    if (!canHover || !animate) return;
    // Keep the rail closed for a short grace period after a cursor-anchored
    // collapse so the hover-expand cannot fight an item click that navigated.
    if (collapsedAtRef.current && Date.now() - collapsedAtRef.current < 600) return;
    clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => setOpen(true), 50);
  }, [canHover, animate, setOpen]);

  const handleMouseLeave = useCallback(() => {
    pointerInsideRef.current = false;
    if (!canHover || !animate) return;
    clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, [canHover, animate, setOpen]);

  useEffect(() => () => clearTimeout(expandTimeoutRef.current), []);

  const sidebarVariants = useMemo(() => {
    const transition = { duration: reduceMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] };
    return {
      expanded: { width: "260px", transition },
      collapsed: { width: "70px", transition }
    };
  }, [reduceMotion]);

  const contentStyle = useMemo(() => ({
    willChange: 'width', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'subpixel-antialiased'
  }), []);

  // Decorative backdrop. Rendered as a fixed-width layer (below) so animating
  // the rail width clips it instead of re-rasterizing this large image on every
  // frame, which is what made open/close feel choppy.
  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${sidebarBG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }), []);

  return (
    <motion.div
      className={cn("relative h-viewport border-r border-white/10 hidden md:flex md:flex-col bg-charcoal overflow-hidden transform-gpu")}
      style={contentStyle}
      variants={sidebarVariants}
      animate={open ? "expanded" : "collapsed"}
      initial={false}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[260px]" style={backgroundStyle} />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <SidebarHeader />
        <ErrorBoundary>
          <div className="flex-1 flex flex-col min-h-0">
            <SidebarMenuContent {...{ mainMenuItems, dataMenuItems, expenseMenuItems, canAccessSettings, hasAnyDataItem, hasAnyExpenseItem, user, isActive, handleNavigation, isDataOpen, setIsDataOpen, isExpensesOpen, setIsExpensesOpen, onExpenseItemClick }} />
          </div>
        </ErrorBoundary>
      </div>
    </motion.div>
  );
});
