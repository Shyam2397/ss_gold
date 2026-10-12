import React, { memo, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSidebar } from './SidebarProvider';
import { SidebarHeader } from './SidebarHeader';
import { SidebarMenuContent } from './SidebarMenuContent';
import { Icons } from './SidebarIcons';
import sidebarBG from '../../asset/sidebarBG.png';

export const SidebarMobile = memo(({
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
  const { mobileOpen, setMobileOpen } = useSidebar();
  const reduceMotion = useReducedMotion();
  const hamburgerRef = useRef(null);
  const panelRef = useRef(null);

  // The drawer is a mobile-only overlay; if the viewport grows while it is open,
  // close it so a stale open drawer cannot leak into the desktop sidebar.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onMatch = (e) => { if (e.matches) setMobileOpen(false); };
    mq.addEventListener('change', onMatch);
    return () => mq.removeEventListener('change', onMatch);
  }, [setMobileOpen]);

  // Close the drawer with Escape, matching typical dialog behaviour.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  // Lock background scrolling while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);

  // Move focus into the drawer on open, keep Tab inside it, and hand focus back
  // to the hamburger on close.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    const getFocusable = () => {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    const first = getFocusable()[0];
    (first || panel)?.focus({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusable();
      if (!nodes.length) { e.preventDefault(); return; }
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Sidebar Button */}
      <div className="md:hidden fixed top-0 left-0 z-40 pt-safe pl-safe">
        <button
          ref={hamburgerRef}
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="sidebar-mobile-menu"
          className="m-4 p-2 rounded-lg bg-charcoal shadow-lg hover:bg-black"
        >
          <Icons.Menu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeInOut" }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sidebar Panel */}
            <motion.div
              ref={panelRef}
              id="sidebar-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              tabIndex={-1}
              className="absolute left-0 top-0 h-viewport w-[80vw] max-w-xs bg-charcoal flex flex-col overflow-hidden pt-safe overscroll-contain outline-none"
              style={{
                backgroundImage: `url(${sidebarBG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 20, stiffness: 150 }}
            >
              <SidebarHeader isMobile={true} />
              <div className="flex-1 flex flex-col min-h-0 pb-safe">
                <SidebarMenuContent isMobile={true} {...{ mainMenuItems, dataMenuItems, expenseMenuItems, canAccessSettings, hasAnyDataItem, hasAnyExpenseItem, user, isActive, handleNavigation, isDataOpen, setIsDataOpen, isExpensesOpen, setIsExpensesOpen, onExpenseItemClick }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
