import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiTag,
  FiCamera,
  FiDatabase,
  FiChevronDown,
  FiChevronRight,
  FiSettings,
  FiDollarSign,
  FiBook,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { GiGoldBar } from 'react-icons/gi';
import { GiTestTubes } from 'react-icons/gi';
import AddExpense from '../expenses/AddExpense';
import MasterExpense from '../expenses/MasterExpense';
import ViewExpense from '../expenses/ViewExpense';
import CashBook from '../cashbook/CashBook';
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";
import Logo from '../../asset/logo.png';

// Define components before they are used
const MenuSection = memo(({ children }) => (
  <div className="py-0.5">
    <nav className="space-y-1 px-3.5">{children}</nav>
  </div>
));

const MenuItem = memo(({ icon: Icon, label, to, isActive, onClick, handleNavigation }) => (
  <Link
    to={to}
    onClick={(e) => {
      e.preventDefault();
      if (onClick) {
        onClick();
      }
      if (to && handleNavigation) {
        handleNavigation(to);
      }
    }}
    className={cn(
      "flex items-center h-8 px-2 rounded-xl transition-all duration-200",
      "relative group",
      isActive
        ? "bg-amber-100 text-amber-900"
        : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
    )}
  >
    <div className="flex items-center justify-center w-5 pl-1">
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-amber-600")} />
    </div>
    {label && (
      <span className="font-medium text-md ml-3 whitespace-nowrap">{label}</span>
    )}
  </Link>
));

const Sidebar = ({ open = true, setOpen, animate = true, user, setLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMasterExpense, setShowMasterExpense] = useState(false);
  const [showViewExpense, setShowViewExpense] = useState(false);
  const [showCashBook, setShowCashBook] = useState(false);

  // Add scroll position management
  useEffect(() => {
    const scrollPositions = new Map();

    const handleScroll = () => {
      scrollPositions.set(location.pathname, window.scrollY);
    };

    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions.get(location.pathname) || 0;
      window.scrollTo(0, savedPosition);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('popstate', restoreScrollPosition);

    // Restore scroll position after route change
    restoreScrollPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', restoreScrollPosition);
    };
  }, [location.pathname]);

  // Optimize navigation
  const handleNavigation = useCallback((to) => {
    // Pre-fetch the next route
    const prefetchRoute = new Promise((resolve) => {
      requestAnimationFrame(() => {
        navigate(to);
        resolve();
      });
    });

    // Smooth transition
    return prefetchRoute.then(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant' // Use 'instant' instead of 'smooth' to prevent lag
      });
    });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
  }, [setLoggedIn]);

  const isActive = (path) => location.pathname === path;

  const mainMenuItems = useMemo(() => [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiUsers, label: 'New Entries', path: '/entries' },
    { icon: FiTag, label: 'Token', path: '/token' },
    { icon: GiTestTubes, label: 'Skin Testing', path: '/skin-testing' },
    { icon: FiCamera, label: 'Photo Testing', path: '/photo-testing' },
    { icon: GiGoldBar, label: 'Pure Exchange', path: '/pure-exchange' },
  ], []);

  const dataMenuItems = useMemo(() => [
    { icon: FiDatabase, label: 'Customer Data', path: '/customer-data' },
    { icon: FiDatabase, label: 'Token Data', path: '/token-data' },
    { icon: FiDatabase, label: 'Skin Test Data', path: '/skintest-data' },
    { icon: FiDatabase, label: 'Exchange Data', path: '/exchange-data' },
  ], []);

  const handleExpenseClick = useCallback((modalSetter) => {
    modalSetter(true);
    setIsExpensesOpen(false);
    if (animate) setOpen(false);
  }, [animate, setOpen]);

  const expenseMenuItems = useMemo(() => [
    { 
      icon: FiDollarSign, 
      label: 'Add Expense', 
      onClick: () => handleExpenseClick(setShowAddExpense)
    },
    { 
      icon: FiDollarSign, 
      label: 'Master Expense', 
      onClick: () => handleExpenseClick(setShowMasterExpense)
    },
    { 
      icon: FiDollarSign, 
      label: 'View Expenses', 
      onClick: () => handleExpenseClick(setShowViewExpense)
    },
    { 
      icon: FiBook, 
      label: 'Cash Book', 
      onClick: () => handleExpenseClick(setShowCashBook)
    },
  ], [handleExpenseClick]);

  const memoizedSidebarContent = useMemo(() => (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Main Menu */}
      <MenuSection>
        {mainMenuItems.map((item) => (
          <MenuItem
            key={item.path}
            icon={item.icon}
            label={open ? item.label : ""}
            to={item.path}
            isActive={isActive(item.path)}
            handleNavigation={handleNavigation}
          />
        ))}
      </MenuSection>

      {/* Data Section */}
      <div>
        <MenuSection>
          <div className="space-y-1">
            <button
              onClick={() => setIsDataOpen(!isDataOpen)}
              className={cn(
                "w-full flex items-center justify-between h-8 px-2",
                "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                "rounded-lg transition-all duration-200"
              )}
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-5 pl-1">
                  <FiDatabase className="h-5 w-5 flex-shrink-0" />
                </div>
                {open && <span className="font-medium text-md ml-3">Data</span>}
              </div>
              {open && (
                <div className="ml-2">
                  {isDataOpen ? (
                    <FiChevronDown className="h-5 w-5" />
                  ) : (
                    <FiChevronRight className="h-5 w-5" />
                  )}
                </div>
              )}
            </button>

            {isDataOpen && open && (
              <div className="pl-4">
                {dataMenuItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    to={item.path}
                    isActive={isActive(item.path)}
                    handleNavigation={handleNavigation}
                  />
                ))}
              </div>
            )}
          </div>
        </MenuSection>
      </div>

      {/* Expenses Section */}
      <MenuSection>
        <div className="space-y-1">
          <button
            onClick={() => setIsExpensesOpen(!isExpensesOpen)}
            className={cn(
              "w-full flex items-center justify-between h-8 px-2",
              "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
              "rounded-lg transition-all duration-200"
            )}
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-5 pl-1">
                <FiDollarSign className="h-5 w-5 flex-shrink-0" />
              </div>
              {open && <span className="font-medium text-md ml-3">Expenses</span>}
            </div>
            {open && (
              <div className="ml-2">
                {isExpensesOpen ? (
                  <FiChevronDown className="h-5 w-5" />
                ) : (
                  <FiChevronRight className="h-5 w-5" />
                )}
              </div>
            )}
          </button>
          {isExpensesOpen && open && (
            <div className="pl-4">
              {expenseMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center h-8 px-2",
                    "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                    "rounded-lg transition-all duration-200"
                  )}
                >
                  <div className="flex items-center justify-center w-5">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                  </div>
                  <span className="font-medium text-md ml-3">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </MenuSection>

      {/* Settings Section */}
      <div>
        <MenuSection>
          {/* User Profile */}
          <div className={cn(
            "flex items-center h-8 px-2 rounded-lg",
            "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
            "transition-all duration-200"
          )}>
            <div className="flex items-center overflow-hidden">
              <div className="flex items-center justify-center w-5 flex-shrink-0">
                <img
                  className="h-5 w-5 rounded-full object-cover border border-amber-200"
                  src={user?.profileImage || 'https://via.placeholder.com/40'}
                  alt="User"
                />
              </div>
              {open && (
                <span className="font-medium text-md ml-3 truncate">
                  {user?.name || 'User'}
                </span>
              )}
            </div>
          </div>

          {/* Settings Menu Item */}
          <MenuItem
            icon={FiSettings}
            label={open ? "Settings" : ""}
            to="/settings"
            isActive={isActive("/settings")}
            handleNavigation={handleNavigation}
          />
        </MenuSection>
      </div>
    </div>
  ), [mainMenuItems, open, isActive, dataMenuItems, expenseMenuItems, isDataOpen, isExpensesOpen, user, handleNavigation]);

  // Update motion.div transition settings
  const sidebarTransition = {
    type: "tween", // Change from default spring to tween
    duration: 0.15, // Reduce duration
    ease: "easeInOut"
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className={cn(
          "h-screen border-r border-gray-200 hidden md:flex md:flex-col bg-white overflow-hidden",
          open ? "w-80" : "w-20"
        )}
        animate={{
          width: animate ? (open ? "260px" : "70px") : "260px",
        }}
        transition={sidebarTransition}
        initial={false} // Disable initial animation
        onMouseEnter={() => animate && setOpen(true)}
        onMouseLeave={() => animate && setOpen(false)}
      >
        {/* Logo Section */}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Area */}
          {memoizedSidebarContent}
          {/* Fixed Logout Button */}
          <div className="border-t border-amber-100 flex-shrink-0 mt-0.5 px-3.5 py-1">
            <MenuItem
              icon={FiLogOut}
              label={open ? "Logout" : ""}
              onClick={handleLogout}
              isActive={false}
              handleNavigation={handleNavigation}
            />
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar Button */}
      <div className="md:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50"
        >
          <FiMenu className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence mode="wait"> {/* Add mode="wait" */}
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.15,
              ease: "easeInOut"
            }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sidebar */}
            <motion.div
              className="absolute inset-y-0 left-0 w-64 bg-white flex flex-col overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Logo Section */}
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

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto">
                  {/* Main Menu */}
                  <MenuSection>
                    {mainMenuItems.map((item) => (
                      <MenuItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        to={item.path}
                        isActive={isActive(item.path)}
                        onClick={() => setOpen(false)}
                        handleNavigation={handleNavigation}
                      />
                    ))}
                  </MenuSection>

                  {/* Data Section */}
                  <MenuSection>
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsDataOpen(!isDataOpen)}
                        className={cn(
                          "w-full flex items-center justify-between h-8 px-2",
                          "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                          "rounded-lg transition-all duration-200"
                        )}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-5">
                            <FiDatabase className="h-5 w-5 flex-shrink-0" />
                          </div>
                          <span className="font-medium text-md ml-3">Data</span>
                        </div>
                        {isDataOpen ? (
                          <FiChevronDown className="h-5 w-5" />
                        ) : (
                          <FiChevronRight className="h-5 w-5" />
                        )}
                      </button>

                      {isDataOpen && (
                        <div className="pl-4 space-y-1">      
                          {dataMenuItems.map((item) => (
                            <MenuItem
                              key={item.path}
                              icon={item.icon}
                              label={item.label}
                              to={item.path}
                              isActive={isActive(item.path)}
                              onClick={() => setOpen(false)}
                              handleNavigation={handleNavigation}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </MenuSection>

                  {/* Expenses Section */}
                  <MenuSection>
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsExpensesOpen(!isExpensesOpen)}
                        className={cn(
                          "w-full flex items-center justify-between h-8 px-2",
                          "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                          "rounded-lg transition-all duration-200"
                        )}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-5">
                            <FiDollarSign className="h-5 w-5 flex-shrink-0" />
                          </div>  
                          <span className="font-medium text-md ml-3">Expenses</span>
                        </div>
                        {isExpensesOpen ? (
                          <FiChevronDown className="h-5 w-5" />
                        ) : (
                          <FiChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      {isExpensesOpen && (
                        <div className="pl-4">
                          {expenseMenuItems.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                item.onClick();
                                setOpen(false);
                                setIsExpensesOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center h-8 px-2",
                                "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                                "rounded-lg transition-all duration-200"
                              )}
                            >
                              <div className="flex items-center justify-center w-5">
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                              </div>
                              <span className="font-medium text-md ml-3">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </MenuSection>

                  {/* Settings Section */}
                  <div>
                    <MenuSection>
                      {/* User Profile */}
                      <div className="flex items-center h-8 px-2 rounded-lg text-gray-600">
                        <div className="flex items-center justify-center w-5 flex-shrink-0">
                          <img
                            className="h-5 w-5 rounded-full object-cover border border-amber-200"
                            src={user?.profileImage || 'https://via.placeholder.com/40'}
                            alt="User"
                          />
                        </div>
                        <span className="font-medium text-md ml-3 truncate">
                          {user?.name || 'User'}
                        </span>
                      </div>

                      {/* Settings Menu Item */}
                      <MenuItem
                        icon={FiSettings}
                        label="Settings"
                        to="/settings"
                        isActive={isActive("/settings")}
                        handleNavigation={handleNavigation}
                      />
                    </MenuSection>
                  </div>
                </div>

                {/* Fixed Logout Button */}
                <div className="border-t border-amber-100 flex-shrink-0 mt-0.5">
                  <MenuItem
                    icon={FiLogOut}
                    label="Logout"
                    onClick={handleLogout}
                    isActive={false}
                    handleNavigation={handleNavigation}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />
      <MasterExpense isOpen={showMasterExpense} onClose={() => setShowMasterExpense(false)} />
      <ViewExpense isOpen={showViewExpense} onClose={() => setShowViewExpense(false)} />
      <CashBook isOpen={showCashBook} onClose={() => setShowCashBook(false)} />
    </>
  );
};

export default memo(Sidebar);
