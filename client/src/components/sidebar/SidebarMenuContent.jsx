import React, { memo, useCallback } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { SidebarMenuSection } from './SidebarMenuSection';
import { SidebarMenuItem } from './SidebarMenuItem';
import { VirtualizedMenuItems } from './VirtualizedMenuItems';
import { useSidebar } from './SidebarProvider';
import { Icons } from './SidebarIcons';
import { cn } from '../../lib/utils';

export const SidebarMenuContent = memo(({
  mainMenuItems,
  dataMenuItems,
  expenseMenuItems,
  user,
  canAccessSettings = true,
  hasAnyDataItem = true,
  hasAnyExpenseItem = true,
  isActive,
  handleNavigation,
  isDataOpen,
  setIsDataOpen,
  isExpensesOpen,
  setIsExpensesOpen,
  onExpenseItemClick, // Renamed from handleExpenseClick for clarity
  isMobile = false, // Add isMobile prop
}) => {
  const { open, setOpen, setMobileOpen } = useSidebar();

  const renderMainMenuItem = useCallback((item) => (
    <SidebarMenuItem
      key={item.path}
      icon={item.icon}
      label={item.label} // The motion span hides it when the sidebar is collapsed
      to={item.path}
      isActive={isActive(item.path)}
      handleNavigation={handleNavigation}
      onClick={isMobile ? () => setMobileOpen(false) : undefined} // Close mobile sidebar on click
    />
  ), [isMobile, isActive, handleNavigation, setMobileOpen]);

  const renderDataMenuItem = useCallback((item) => (
    <SidebarMenuItem
      key={item.path}
      icon={item.icon}
      label={item.label} // Always show label in dropdown
      to={item.path}
      isActive={isActive(item.path)}
      handleNavigation={handleNavigation}
      onClick={isMobile ? () => setMobileOpen(false) : undefined} // Close mobile sidebar on click
    />
  ), [isActive, handleNavigation, isMobile, setMobileOpen]);

  const renderExpenseButtonItem = useCallback((item) => {
    const itemActive = isActive(item.path);
    return (
      <button
        key={item.label}
        type="button"
        aria-current={itemActive ? 'page' : undefined}
        className={cn(
          "w-full flex items-center h-9 px-2",
          itemActive
            ? "bg-gold-bright/15 text-gold-bright font-semibold"
            : "text-white/60 hover:bg-white/5 hover:text-gold-bright",
          "rounded-xl transition-all duration-200 text-left"
        )}
        onClick={() => {
          // Single dispatch point: onExpenseItemClick (handleExpenseClick) runs
          // item.onClick / item.modalSetter exactly once, then closes the menu.
          if (onExpenseItemClick) onExpenseItemClick(item);
          else if (item.onClick) item.onClick();
          if (isMobile) setMobileOpen(false);
        }}
      >
        <div className="flex items-center justify-center w-5"><item.icon className={cn("h-5 w-5 flex-shrink-0", itemActive && "text-gold-bright")} /></div>
        <span className={cn("font-medium text-md ml-3", itemActive && "text-gold-bright")}>{item.label}</span>
      </button>
    );
  }, [onExpenseItemClick, isMobile, setMobileOpen, isActive]);

  const isDataSectionActive = dataMenuItems.some((item) => isActive(item.path));
  const isExpensesSectionActive = expenseMenuItems.some((item) => isActive(item.path));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Main Menu */}
      <SidebarMenuSection>
        <VirtualizedMenuItems items={mainMenuItems} renderItem={renderMainMenuItem} />
      </SidebarMenuSection>

      {/* Data Section */}
      {hasAnyDataItem && (
      <SidebarMenuSection>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              // From the collapsed desktop rail a click should expand the sidebar
              // and reveal the section, otherwise the toggle appears dead.
              if (!open && !isMobile) {
                setOpen(true);
                setIsDataOpen(true);
              } else {
                setIsDataOpen((prev) => !prev);
              }
            }}
            aria-expanded={isDataOpen}
            aria-controls={isDataOpen && (open || isMobile) ? "sidebar-data-menu" : undefined}
            aria-label="Toggle Data section"
            title={open || isMobile ? undefined : "Data"}
            className={cn(
              "w-full flex items-center justify-between h-9 px-2",
              isDataSectionActive ? "text-gold-bright" : "text-white/60",
              "hover:bg-white/5 hover:text-gold-bright",
              "rounded-xl transition-all duration-200"
            )}
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-5 pl-1"><Icons.Database className="h-5 w-5 flex-shrink-0" /></div>
              {(open || isMobile) && <span className="font-medium text-md ml-3">Data</span>}
            </div>
            {(open || isMobile) && (
              <div className="ml-2">{isDataOpen ? <FiChevronDown className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}</div>
            )}
          </button>
          {isDataOpen && (open || isMobile) && (
            <div className="pl-4" id="sidebar-data-menu">
              <VirtualizedMenuItems items={dataMenuItems} renderItem={renderDataMenuItem} />
            </div>
          )}
        </div>
      </SidebarMenuSection>
      )}

      {/* Expenses Section */}
      {hasAnyExpenseItem && (
      <SidebarMenuSection>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              if (!open && !isMobile) {
                setOpen(true);
                setIsExpensesOpen(true);
              } else {
                setIsExpensesOpen((prev) => !prev);
              }
            }}
            aria-expanded={isExpensesOpen}
            aria-controls={isExpensesOpen && (open || isMobile) ? "sidebar-expenses-menu" : undefined}
            aria-label="Toggle Expenses section"
            title={open || isMobile ? undefined : "Expenses"}
            className={cn(
              "w-full flex items-center justify-between h-9 px-2",
              isExpensesSectionActive ? "text-gold-bright" : "text-white/60",
              "hover:bg-white/5 hover:text-gold-bright",
              "rounded-xl transition-all duration-200"
            )}
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-5 pl-1"><Icons.DollarSign className="h-5 w-5 flex-shrink-0" /></div>
              {(open || isMobile) && <span className="font-medium text-md ml-3">Expenses</span>}
            </div>
            {(open || isMobile) && (
              <div className="ml-2">{isExpensesOpen ? <FiChevronDown className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}</div>
            )}
          </button>
          {isExpensesOpen && (open || isMobile) && (
            <div className="pl-4" id="sidebar-expenses-menu">
              <VirtualizedMenuItems items={expenseMenuItems} renderItem={renderExpenseButtonItem} />
            </div>
          )}
        </div>
      </SidebarMenuSection>
      )}

      {/* Settings Section */}
      {canAccessSettings && (
      <SidebarMenuSection>
        <SidebarMenuItem icon={Icons.Settings} label="Settings" to="/settings" isActive={isActive("/settings")} handleNavigation={handleNavigation} onClick={isMobile ? () => setMobileOpen(false) : undefined} />
      </SidebarMenuSection>
      )}
    </div>
  );
});