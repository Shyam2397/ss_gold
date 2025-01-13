import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'react-icons/fi';
import { GiGoldBar } from 'react-icons/gi';
import { GiTestTubes } from 'react-icons/gi';
import AddExpense from '../expenses/AddExpense';
import MasterExpense from '../expenses/MasterExpense';
import ViewExpense from '../expenses/ViewExpense';
import CashBook from '../cashbook/CashBook';
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { cn } from "../../lib/utils";

const MenuItem = ({ icon: Icon, label, to, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center h-10 px-4 rounded-lg transition-all duration-200",
      "relative group",
      isActive
        ? "bg-amber-100 text-amber-900"
        : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
    )}
  >
    <div className="flex items-center justify-center w-5">
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-amber-600")} />
    </div>
    {label && (
      <span className="font-medium ml-3 whitespace-nowrap">{label}</span>
    )}
  </Link>
);

const MenuSection = ({ children }) => (
  <div className="py-0.5">
    <nav className="space-y-[2px]">{children}</nav>
  </div>
);

const Sidebar = ({ open = true, setOpen, animate = true }) => {
  const location = useLocation();
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMasterExpense, setShowMasterExpense] = useState(false);
  const [showViewExpense, setShowViewExpense] = useState(false);
  const [showCashBook, setShowCashBook] = useState(false);

  const isActive = (path) => location.pathname === path;

  const mainMenuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiUsers, label: 'New Entries', path: '/entries' },
    { icon: FiTag, label: 'Token', path: '/token' },
    { icon: GiTestTubes, label: 'Skin Testing', path: '/skin-testing' },
    { icon: FiCamera, label: 'Photo Testing', path: '/photo-testing' },
    { icon: GiGoldBar, label: 'Pure Exchange', path: '/pure-exchange' },
  ];

  const dataMenuItems = [
    { icon: FiDatabase, label: 'Customer Data', path: '/customer-data' },
    { icon: FiDatabase, label: 'Token Data', path: '/token-data' },
    { icon: FiDatabase, label: 'Skin Test Data', path: '/skintest-data' },
    { icon: FiDatabase, label: 'Exchange Data', path: '/exchange-data' },
  ];

  const expenseMenuItems = [
    { icon: FiDollarSign, label: 'Add Expense', onClick: () => setShowAddExpense(true) },
    { icon: FiDollarSign, label: 'Master Expense', onClick: () => setShowMasterExpense(true) },
    { icon: FiDollarSign, label: 'View Expenses', onClick: () => setShowViewExpense(true) },
    { icon: FiBook, label: 'Cash Book', onClick: () => setShowCashBook(true) },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className={cn(
          "h-screen border-r border-gray-200 hidden md:flex md:flex-col bg-white",
          open ? "w-64" : "w-16"
        )}
        animate={{
          width: animate ? (open ? "256px" : "64px") : "256px",
        }}
        onMouseEnter={() => animate && setOpen(true)}
        onMouseLeave={() => animate && setOpen(false)}
      >
        <div className="flex flex-col h-full overflow-y-auto pt-1">
          {/* Main Menu */}
          <MenuSection>
            {mainMenuItems.map((item) => (
              <motion.div
                key={item.path}
                animate={{
                  x: open ? 0 : 0,
                }}
              >
                <MenuItem
                  icon={item.icon}
                  label={open ? item.label : ""}
                  to={item.path}
                  isActive={isActive(item.path)}
                />
              </motion.div>
            ))}
          </MenuSection>

          {/* Data Section */}
          <MenuSection>
            <div className="space-y-1">
              <button
                onClick={() => setIsDataOpen(!isDataOpen)}
                className={cn(
                  "w-full flex items-center justify-between h-10 px-4",
                  "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                  "rounded-lg transition-all duration-200"
                )}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5">
                    <FiDatabase className="h-5 w-5 flex-shrink-0" />
                  </div>
                  {open && <span className="font-medium ml-3">Data</span>}
                </div>
                {open && (
                  <div className="ml-2">
                    {isDataOpen ? (
                      <FiChevronDown className="h-4 w-4" />
                    ) : (
                      <FiChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
              </button>

              {isDataOpen && open && (
                <div className="pl-4 space-y-1">
                  {dataMenuItems.map((item) => (
                    <MenuItem
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      to={item.path}
                      isActive={isActive(item.path)}
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
                  "w-full flex items-center justify-between h-10 px-4",
                  "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                  "rounded-lg transition-all duration-200"
                )}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5">
                    <FiDollarSign className="h-5 w-5 flex-shrink-0" />
                  </div>
                  {open && <span className="font-medium ml-3">Expenses</span>}
                </div>
                {open && (
                  <div className="ml-2">
                    {isExpensesOpen ? (
                      <FiChevronDown className="h-4 w-4" />
                    ) : (
                      <FiChevronRight className="h-4 w-4" />
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
                        "w-full flex items-center h-10 px-4",
                        "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                        "rounded-lg transition-all duration-200"
                      )}
                    >
                      <div className="flex items-center justify-center w-5">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      <span className="font-medium ml-3">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </MenuSection>

          {/* Settings Section */}
          <div className="mt-auto">
            <MenuSection>
              <MenuItem
                icon={FiSettings}
                label={open ? "Settings" : ""}
                to="/settings"
                isActive={isActive('/settings')}
              />
            </MenuSection>
          </div>

          {/* Version Info */}
          {open && (
            <div className="mt-auto px-4 py-2 border-t border-amber-100">
              <div className="text-xs text-gray-500">
                <p>Version 1.0.0</p>
                <p className="mt-1"> 2024 SS Gold</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Sidebar Button */}
      <div className="md:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50"
        >
          <IconMenu2 className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              className="absolute inset-y-0 left-0 w-64 bg-white"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <IconX className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              <div className="flex flex-col h-full overflow-y-auto pt-1 pb-4">
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
                    />
                  ))}
                </MenuSection>

                {/* Data Section */}
                <MenuSection>
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsDataOpen(!isDataOpen)}
                      className={cn(
                        "w-full flex items-center justify-between h-10 px-4",
                        "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                        "rounded-lg transition-all duration-200"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-5">
                          <FiDatabase className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <span className="font-medium ml-3">Data</span>
                      </div>
                      {isDataOpen ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
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
                        "w-full flex items-center justify-between h-10 px-4",
                        "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                        "rounded-lg transition-all duration-200"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-5">
                          <FiDollarSign className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <span className="font-medium ml-3">Expenses</span>
                      </div>
                      {isExpensesOpen ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
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
                            }}
                            className={cn(
                              "w-full flex items-center h-10 px-4",
                              "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
                              "rounded-lg transition-all duration-200"
                            )}
                          >
                            <div className="flex items-center justify-center w-5">
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                            </div>
                            <span className="font-medium ml-3">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </MenuSection>

                {/* Settings Section */}
                <div className="mt-auto">
                  <MenuSection>
                    <MenuItem
                      icon={FiSettings}
                      label="Settings"
                      to="/settings"
                      isActive={isActive('/settings')}
                      onClick={() => setOpen(false)}
                    />
                  </MenuSection>
                </div>

                {/* Version Info */}
                <div className="mt-auto px-4 py-2 border-t border-amber-100">
                  <div className="text-xs text-gray-500">
                    <p>Version 1.0.0</p>
                    <p className="mt-1"> 2024 SS Gold</p>
                  </div>
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

export default Sidebar;
