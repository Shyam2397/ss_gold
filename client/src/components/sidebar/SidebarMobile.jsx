import React, { memo, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from './SidebarProvider';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { SidebarMenuContent } from './SidebarMenuContent';
import { Icons } from './SidebarIcons';

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

  return (
    <>
      {/* Mobile Sidebar Button */}
      <div className="md:hidden fixed top-0 left-0 z-20 m-4">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="sidebar-mobile-menu"
          className="p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50"
        >
          <Icons.Menu className="h-6 w-6 text-gray-600" />
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
            transition={{ duration: 0.15, ease: "easeInOut" }}
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
              id="sidebar-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="absolute inset-y-0 left-0 w-64 bg-white flex flex-col overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }} // Adjusted stiffness
            >
              <SidebarHeader isMobile={true} />
              <div className="flex-1 flex flex-col min-h-0">
                <SidebarMenuContent isMobile={true} {...{ mainMenuItems, dataMenuItems, expenseMenuItems, canAccessSettings, hasAnyDataItem, hasAnyExpenseItem, user, isActive, handleNavigation, isDataOpen, setIsDataOpen, isExpensesOpen, setIsExpensesOpen, onExpenseItemClick }} />
                <SidebarFooter handleLogout={handleLogout} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});