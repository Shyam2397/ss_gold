import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from 'react-icons/fi';
import Logo from '../../asset/logo.png';
import SidebarContent from './SidebarContent';

const MobileSidebar = ({ 
  open, 
  setOpen, 
  user, 
  handleLogout, 
  isActive,
  setShowAddExpense,
  setShowMasterExpense,
  setShowViewExpense,
  setShowCashBook
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50"
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        <motion.div
          className="absolute inset-y-0 left-0 w-64 bg-white flex flex-col overflow-hidden"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="flex items-center h-16 px-4 border-b border-amber-100">
            <div className="flex items-center">
              <img src={Logo} alt="SS Gold" className="h-8 w-8" />
              <span className="ml-2 text-xl font-semibold text-amber-900">
                SS Gold
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto p-2 rounded-lg hover:bg-gray-100"
            >
              <FiX className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <SidebarContent 
            open={true}
            user={user}
            isActive={isActive}
            handleLogout={handleLogout}
            isMobile={true}
            setOpen={setOpen}
            setShowAddExpense={setShowAddExpense}
            setShowMasterExpense={setShowMasterExpense}
            setShowViewExpense={setShowViewExpense}
            setShowCashBook={setShowCashBook}
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default React.memo(MobileSidebar);
