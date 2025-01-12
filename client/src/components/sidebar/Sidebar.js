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

const MenuItem = ({ icon: Icon, label, to, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-1 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-amber-100 text-amber-900'
        : 'text-gray-600 hover:bg-amber-50 hover:text-amber-900'
    }`}
  >
    <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : ''}`} />
    <span className="font-medium">{label}</span>
  </Link>
);

const MenuSection = ({ title, children }) => (
  <div className="py-1.5">
    <h3 className="px-4 py-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {title}
    </h3>
    <nav className="space-y-1">{children}</nav>
  </div>
);

const Sidebar = ({ isOpen, toggleSidebar }) => {
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
    <div className="h-screen bg-white border-r border-gray-200 w-64 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Main Menu */}
        <MenuSection title="Main Menu">
          {mainMenuItems.map((item) => (
            <MenuItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              to={item.path}
              isActive={isActive(item.path)}
            />
          ))}
        </MenuSection>

        {/* Data Section */}
        <MenuSection title="Data Management">
          <div className="space-y-1">
            <button
              onClick={() => setIsDataOpen(!isDataOpen)}
              className="w-full flex items-center justify-between px-4 py-1 text-gray-600 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <FiDatabase className="h-5 w-5" />
                <span className="font-medium">Data</span>
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
                  />
                ))}
              </div>
            )}
          </div>
        </MenuSection>

        {/* Expenses Section */}
        <MenuSection title="Expenses">
          <div className="space-y-1">
            <button
              onClick={() => setIsExpensesOpen(!isExpensesOpen)}
              className="w-full flex items-center justify-between px-4 py-1 text-gray-600 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <FiDollarSign className="h-5 w-5" />
                <span className="font-medium">Expenses</span>
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
                  item.path ? (
                    <MenuItem
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      to={item.path}
                      isActive={isActive(item.path)}
                    />
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center space-x-2 px-4 py-1 text-gray-600 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-all duration-200"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </MenuSection>

        {/* Settings Section */}
        <div className="mt-auto">
          <MenuSection title="Settings">
            <MenuItem
              icon={FiSettings}
              label="Settings"
              to="/settings"
              isActive={isActive('/settings')}
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
      <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />
      <MasterExpense isOpen={showMasterExpense} onClose={() => setShowMasterExpense(false)} />
      <ViewExpense isOpen={showViewExpense} onClose={() => setShowViewExpense(false)} />
      <CashBook isOpen={showCashBook} onClose={() => setShowCashBook(false)} />
      <MenuItem icon={FiCamera} label="Pure Exchange" to="/pure-exchange" isActive={location.pathname === '/pure-exchange'} />
    </div>
  );
};

export default Sidebar;
