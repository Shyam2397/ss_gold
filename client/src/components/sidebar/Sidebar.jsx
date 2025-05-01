import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiTag,
  FiCamera,
  FiDatabase,
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
import { throttle } from "../../lib/utils";
import { SCROLL_BEHAVIOR } from '../../routes';
import { SidebarProvider, useSidebar } from './SidebarProvider';
import { SidebarDesktop } from './SidebarDesktop';
import { SidebarMobile } from './SidebarMobile';

// Main Sidebar component orchestrating context and content
const Sidebar = ({ open: openProp, setOpen: setOpenProp, animate = true, user, setLoggedIn }) => {
  return (
    <SidebarProvider openProp={openProp} setOpenProp={setOpenProp} animate={animate}>
      <SidebarContent user={user} setLoggedIn={setLoggedIn} />
    </SidebarProvider>
  );
};

// Content component managing state and logic, rendering Desktop/Mobile versions
const SidebarContent = memo(({ user, setLoggedIn }) => {
  const { setOpen, animate } = useSidebar(); // Get setOpen/animate from context
  const location = useLocation();
  const navigate = useNavigate();
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMasterExpense, setShowMasterExpense] = useState(false);
  const [showViewExpense, setShowViewExpense] = useState(false);
  const [showCashBook, setShowCashBook] = useState(false);
  const scrollPositionsRef = useRef(new Map());
  const [isNavigating, setIsNavigating] = useState(false);

  const throttledScroll = useMemo(
    () =>
      throttle((pathname, scrollY) => {
        scrollPositionsRef.current.set(pathname, scrollY);
      }, 100),
    []
  );

  useEffect(() => {
    let lastKnownPosition = window.scrollY;

    const handleScroll = throttle(() => {
      lastKnownPosition = window.scrollY;
      scrollPositionsRef.current.set(location.pathname, lastKnownPosition);
    }, 100);

    const handleBeforeUnload = () => {
      // Save final scroll position before unload
      scrollPositionsRef.current.set(location.pathname, lastKnownPosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  // Enhanced navigation handling with special case for entries
  const handleNavigation = useCallback((to) => {
    // Batch state updates
    const performNavigation = () => {
      const currentPosition = window.scrollY;
      const scrollBehavior = SCROLL_BEHAVIOR[to];

      // Use React 18's automatic batching
      if (scrollBehavior?.maintainScroll) {
        const savedPosition = scrollPositionsRef.current.get(to) || 0;
        requestAnimationFrame(() => {
          navigate(to);
          window.scrollTo({
            top: savedPosition,
            behavior: 'instant'
          });
        });
      } else {
        window.scrollTo(0, 0);
        navigate(to);
      }
    };

    // Debounce navigation to prevent rapid clicks
    if (!isNavigating) {
      setIsNavigating(true);
      performNavigation();
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, isNavigating]);

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
  
  // Define modal setters for expense items
  const expenseModalSetters = useMemo(() => ({
    add: setShowAddExpense,
    master: setShowMasterExpense,
    view: setShowViewExpense,
    cashbook: setShowCashBook,
  }), []);

  const expenseMenuItems = useMemo(() => [
    { icon: FiDollarSign, label: 'Add Expense', modalSetter: expenseModalSetters.add },
    { icon: FiDollarSign, label: 'Master Expense', modalSetter: expenseModalSetters.master },
    { icon: FiDollarSign, label: 'View Expenses', modalSetter: expenseModalSetters.view },
    { icon: FiBook, label: 'Cash Book', modalSetter: expenseModalSetters.cashbook },
  ], [expenseModalSetters]);

  // Props to pass down to both Desktop and Mobile Sidebars
  const commonSidebarProps = {
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
    onExpenseItemClick: handleExpenseClick, // Pass the handler
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <SidebarDesktop {...commonSidebarProps} />

      {/* Mobile Sidebar */}
      <SidebarMobile {...commonSidebarProps} />

      {/* Modals */}
      <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />
      <MasterExpense isOpen={showMasterExpense} onClose={() => setShowMasterExpense(false)} />
      <ViewExpense isOpen={showViewExpense} onClose={() => setShowViewExpense(false)} />
      <CashBook isOpen={showCashBook} onClose={() => setShowCashBook(false)} />
    </>
  );
});

export default memo(Sidebar);
