import React, { useState } from 'react';
import { 
  FiHome, FiUsers, FiTag, FiCamera, FiDatabase,
  FiChevronDown, FiChevronRight, FiSettings,
  FiDollarSign, FiBook, FiLogOut
} from 'react-icons/fi';
import { GiGoldBar, GiTestTubes } from 'react-icons/gi';
import { cn } from "../../lib/utils";
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';

const SidebarContent = ({ 
  open, 
  user, 
  isActive, 
  handleLogout, 
  isMobile, 
  setOpen,
  setShowAddExpense,
  setShowMasterExpense, 
  setShowViewExpense,
  setShowCashBook
}) => {
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);

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
    { 
      icon: FiDollarSign, 
      label: 'Add Expense',
      onClick: () => {
        setShowAddExpense(true);
        isMobile && setOpen(false);
        setIsExpensesOpen(false);
      }
    },
    { 
      icon: FiDollarSign, 
      label: 'Master Expense',
      onClick: () => {
        setShowMasterExpense(true);
        isMobile && setOpen(false);
        setIsExpensesOpen(false);
      }
    },
    { 
      icon: FiDollarSign, 
      label: 'View Expenses',
      onClick: () => {
        setShowViewExpense(true);
        isMobile && setOpen(false);
        setIsExpensesOpen(false);
      }
    },
    { 
      icon: FiBook, 
      label: 'Cash Book',
      onClick: () => {
        setShowCashBook(true);
        isMobile && setOpen(false);
        setIsExpensesOpen(false);
      }
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Menu */}
        <MenuSection>
          {mainMenuItems.map((item) => (
            <MenuItem
              key={item.path}
              icon={item.icon}
              label={open || isMobile ? item.label : ""}
              to={item.path}
              isActive={isActive(item.path)}
              onClick={() => isMobile && setOpen(false)}
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
                <div className="flex items-center justify-center w-5 pl-1">
                  <FiDatabase className="h-5 w-5 flex-shrink-0" />
                </div>
                {(open || isMobile) && <span className="font-medium text-md ml-3">Data</span>}
              </div>
              {(open || isMobile) && (
                <div className="ml-2">
                  {isDataOpen ? (
                    <FiChevronDown className="h-5 w-5" />
                  ) : (
                    <FiChevronRight className="h-5 w-5" />
                  )}
                </div>
              )}
            </button>

            {isDataOpen && (open || isMobile) && (
              <div className="pl-4">
                {dataMenuItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    to={item.path}
                    isActive={isActive(item.path)}
                    onClick={() => isMobile && setOpen(false)}
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
                <div className="flex items-center justify-center w-5 pl-1">
                  <FiDollarSign className="h-5 w-5 flex-shrink-0" />
                </div>
                {(open || isMobile) && <span className="font-medium text-md ml-3">Expenses</span>}
              </div>
              {(open || isMobile) && (
                <div className="ml-2">
                  {isExpensesOpen ? (
                    <FiChevronDown className="h-5 w-5" />
                  ) : (
                    <FiChevronRight className="h-5 w-5" />
                  )}
                </div>
              )}
            </button>

            {isExpensesOpen && (open || isMobile) && (
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
              {(open || isMobile) && (
                <span className="font-medium text-md ml-3 truncate">
                  {user?.name || 'User'}
                </span>
              )}
            </div>
          </div>

          <MenuItem
            icon={FiSettings}
            label={open || isMobile ? "Settings" : ""}
            to="/settings"
            isActive={isActive("/settings")}
            onClick={() => isMobile && setOpen(false)}
          />
        </MenuSection>
      </div>

      {/* Fixed Logout Button */}
      <div className="border-t border-amber-100 flex-shrink-0 mt-0.5 px-3.5 py-1">
        <MenuItem
          icon={FiLogOut}
          label={open || isMobile ? "Logout" : ""}
          onClick={handleLogout}
          isActive={false}
        />
      </div>
    </div>
  );
};

export default React.memo(SidebarContent);
