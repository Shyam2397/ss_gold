import React, { memo, useCallback } from 'react';
import { FiDatabase, FiDollarSign, FiSettings, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { SidebarMenuSection } from './SidebarMenuSection';
import { SidebarMenuItem } from './SidebarMenuItem';
import { VirtualizedMenuItems } from './VirtualizedMenuItems';
import { useSidebar } from './SidebarProvider';
import { cn } from '../../lib/utils';

export const SidebarMenuContent = memo(({
  mainMenuItems,
  dataMenuItems,
  expenseMenuItems,
  user,
  isActive,
  handleNavigation,
  isDataOpen,
  setIsDataOpen,
  isExpensesOpen,
  setIsExpensesOpen,
  onExpenseItemClick, // Renamed from handleExpenseClick for clarity
  isMobile = false, // Add isMobile prop
}) => {
  const { open, setOpen } = useSidebar();

  const renderMainMenuItem = useCallback((item) => (
    <SidebarMenuItem
      key={item.path}
      icon={item.icon}
      label={open || isMobile ? item.label : ""} // Show label if mobile or open
      to={item.path}
      isActive={isActive(item.path)}
      handleNavigation={handleNavigation}
      onClick={isMobile ? () => setOpen(false) : undefined} // Close mobile sidebar on click
    />
  ), [open, isMobile, isActive, handleNavigation, setOpen]);

  const renderDataMenuItem = useCallback((item) => (
    <SidebarMenuItem
      key={item.path}
      icon={item.icon}
      label={item.label} // Always show label in dropdown
      to={item.path}
      isActive={isActive(item.path)}
      handleNavigation={handleNavigation}
      onClick={isMobile ? () => setOpen(false) : undefined} // Close mobile sidebar on click
    />
  ), [isActive, handleNavigation, isMobile, setOpen]);

  const renderExpenseButtonItem = useCallback((item) => (
    <button
      key={item.label}
      onClick={() => {
        onExpenseItemClick(item.modalSetter);
        if (isMobile) setOpen(false); // Close mobile sidebar on click
      }}
      className={cn(
        "w-full flex items-center h-8 px-2",
        "text-gray-600 hover:bg-amber-50 hover:text-amber-900",
        "rounded-lg transition-all duration-200"
      )}
    >
      <div className="flex items-center justify-center w-5"><item.icon className="h-5 w-5 flex-shrink-0" /></div>
      <span className="font-medium text-md ml-3">{item.label}</span>
    </button>
  ), [onExpenseItemClick, isMobile, setOpen]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Main Menu */}
      <SidebarMenuSection>
        <VirtualizedMenuItems items={mainMenuItems} renderItem={renderMainMenuItem} />
      </SidebarMenuSection>

      {/* Data Section */}
      <SidebarMenuSection>
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
              <div className="flex items-center justify-center w-5 pl-1"><FiDatabase className="h-5 w-5 flex-shrink-0" /></div>
              {(open || isMobile) && <span className="font-medium text-md ml-3">Data</span>}
            </div>
            {(open || isMobile) && (
              <div className="ml-2">{isDataOpen ? <FiChevronDown className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}</div>
            )}
          </button>
          {isDataOpen && (open || isMobile) && (
            <div className="pl-4">
              <VirtualizedMenuItems items={dataMenuItems} renderItem={renderDataMenuItem} />
            </div>
          )}
        </div>
      </SidebarMenuSection>

      {/* Expenses Section */}
      <SidebarMenuSection>
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
              <div className="flex items-center justify-center w-5 pl-1"><FiDollarSign className="h-5 w-5 flex-shrink-0" /></div>
              {(open || isMobile) && <span className="font-medium text-md ml-3">Expenses</span>}
            </div>
            {(open || isMobile) && (
              <div className="ml-2">{isExpensesOpen ? <FiChevronDown className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}</div>
            )}
          </button>
          {isExpensesOpen && (open || isMobile) && (
            <div className="pl-4">
              <VirtualizedMenuItems items={expenseMenuItems} renderItem={renderExpenseButtonItem} />
            </div>
          )}
        </div>
      </SidebarMenuSection>

      {/* Settings Section */}
      <SidebarMenuSection>
        {/* User Profile - Simplified for mobile/collapsed */}
        <div className={cn("flex items-center h-8 px-2 rounded-lg text-gray-600 transition-all duration-200", !isMobile && "hover:bg-amber-50 hover:text-amber-900")}>
          <div className="flex items-center overflow-hidden">
            <div className="flex items-center justify-center w-5 flex-shrink-0 pl-1"><img className="h-5 w-5 rounded-full object-cover border border-amber-200" src={user?.profileImage || 'https://via.placeholder.com/40'} alt="User" /></div>
            {(open || isMobile) && <span className="font-medium text-md ml-3 truncate">{user?.name || 'User'}</span>}
          </div>
        </div>
        {/* Settings Menu Item */}
        <SidebarMenuItem icon={FiSettings} label={open || isMobile ? "Settings" : ""} to="/settings" isActive={isActive("/settings")} handleNavigation={handleNavigation} onClick={isMobile ? () => setOpen(false) : undefined} />
      </SidebarMenuSection>
    </div>
  );
});