import React from 'react';
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import Logo from '../../asset/logo.png';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';
import SidebarContent from './SidebarContent';

const DesktopSidebar = ({ 
  open, 
  setOpen, 
  animate, 
  user, 
  handleLogout, 
  isActive,
  setShowAddExpense,
  setShowMasterExpense,
  setShowViewExpense, 
  setShowCashBook
}) => (
  <motion.div
    className={cn(
      "h-screen border-r border-gray-200 hidden md:flex md:flex-col bg-white overflow-hidden",
      open ? "w-80" : "w-20"
    )}
    animate={{
      width: animate ? (open ? "260px" : "70px") : "260px",
    }}
    onMouseEnter={() => animate && setOpen(true)}
    onMouseLeave={() => animate && setOpen(false)}
  >
    <div className="flex items-center h-20 px-4 border-b border-amber-100 flex-shrink-0">
      <div className="flex items-center align-middle overflow-hidden">
        <img src={Logo} alt="SS Gold" className="h-8 w-9 flex-shrink-0" />
        {open && (
          <span className="ml-3 pt-1 text-3xl font-bold text-amber-900 truncate">
            SS Gold
          </span>
        )}
      </div>
    </div>
    
    <SidebarContent 
      open={open}
      user={user}
      isActive={isActive}
      handleLogout={handleLogout}
      isMobile={false}
      setOpen={setOpen}
      setShowAddExpense={setShowAddExpense}
      setShowMasterExpense={setShowMasterExpense}
      setShowViewExpense={setShowViewExpense}
      setShowCashBook={setShowCashBook}
    />
  </motion.div>
);

export default React.memo(DesktopSidebar);
