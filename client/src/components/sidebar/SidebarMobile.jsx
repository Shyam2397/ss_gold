import React, { memo } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu } from 'react-icons/fi';
import { useSidebar } from './SidebarProvider';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { SidebarMenuContent } from './SidebarMenuContent';

export const SidebarMobile = memo(({
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
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Mobile Sidebar Button */}
      <div className="md:hidden fixed top-0 left-0 z-20 m-4">
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50">
          <FiMenu className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence mode="wait">
        {open && (
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
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sidebar Panel */}
            <motion.div
              className="absolute inset-y-0 left-0 w-64 bg-white flex flex-col overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }} // Adjusted stiffness
            >
              <SidebarHeader isMobile={true} />
              <div className="flex-1 flex flex-col min-h-0">
                <SidebarMenuContent isMobile={true} {...{ mainMenuItems, dataMenuItems, expenseMenuItems, user, isActive, handleNavigation, isDataOpen, setIsDataOpen, isExpensesOpen, setIsExpensesOpen, onExpenseItemClick }} />
                <SidebarFooter handleLogout={handleLogout} handleNavigation={handleNavigation} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});