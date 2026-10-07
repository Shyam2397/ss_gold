import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { Icons } from './SidebarIcons';
import { throttle } from "../../lib/utils";
import { SCROLL_BEHAVIOR } from '../../routes';
import { logoutUser } from '../../services/authService';
import { useUser } from '../UserInterface/UserContext';
import { filterByPermission, canAccessPath as canAccessPathFor } from '../../utils/permissions';
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
  const { user: sessionUser } = useUser();
  // Single source of truth for permissions AND the account card. The context
  // session user is preferred; the prop is only a fallback for renderers that
  // mount Sidebar without a UserProvider.
  const activeUser = sessionUser ?? user;
  const location = useLocation();
  const navigate = useNavigate();
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const scrollPositionsRef = useRef(new Map());
  const [isNavigating, setIsNavigating] = useState(false);
  const navTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(navTimeoutRef.current), []);

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
      // Close any open Data/Expenses submenu and collapse the desktop rail in
      // the same gesture that navigates. Otherwise the rail stays expanded for
      // a frame (flashing with the section still open) before MainLayout's
      // post-paint effect collapses it, and the sections re-open on the next
      // expand because their state was left behind.
      setIsDataOpen(false);
      setIsExpensesOpen(false);
      if (animate && window.matchMedia('(min-width: 768px)').matches) setOpen(false);
      performNavigation();
      clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, isNavigating, animate, setOpen]);

  const handleLogout = useCallback(() => {
    logoutUser();
    setLoggedIn(false);
  }, [setLoggedIn]);

  // Active when the current route equals the item's path or lives under it, so
  // a detail view like /entries/5 still highlights "New Entries". A trailing
  // slash boundary keeps sibling prefixes from matching (/token vs /token-data).
  const isActive = useCallback((path) => {
    if (!path) return false;
    const current = location.pathname;
    return current === path || current.startsWith(`${path.replace(/\/+$/, '')}/`);
  }, [location.pathname]);

  const allMainMenuItems = useMemo(() => [
    { icon: Icons.Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Icons.Users, label: 'New Entries', path: '/entries' },
    { icon: Icons.Tag, label: 'Token', path: '/token' },
    { icon: Icons.TestTubes, label: 'Skin Testing', path: '/skin-testing' },
    { icon: Icons.Camera, label: 'Photo Testing', path: '/photo-testing' },
    { icon: Icons.GoldBar, label: 'Pure Exchange', path: '/pure-exchange' },
  ], []);

  const allDataMenuItems = useMemo(() => [
    { icon: Icons.Database, label: 'Customer Data', path: '/customer-data' },
    { icon: Icons.Database, label: 'Token Data', path: '/token-data' },
    { icon: Icons.Database, label: 'Skin Test Data', path: '/skintest-data' },
    { icon: Icons.Database, label: 'Exchange Data', path: '/exchange-data' },
    { icon: Icons.DollarSign, label: 'Unpaid Customers', path: '/unpaid-customers' },
  ], []);

  // Hide anything the signed in account has not been granted
  const mainMenuItems = useMemo(
    () => filterByPermission(activeUser, allMainMenuItems),
    [activeUser, allMainMenuItems]
  );
  const dataMenuItems = useMemo(
    () => filterByPermission(activeUser, allDataMenuItems),
    [activeUser, allDataMenuItems]
  );

  const handleExpenseClick = useCallback((item) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsExpensesOpen(false);
    // Forces the hover-expanded desktop rail shut immediately. On mobile the
    // drawer is closed by the menu handler, so the desktop state is left alone.
    if (animate && window.matchMedia('(min-width: 768px)').matches) setOpen(false);
  }, [animate, setOpen]);

  const allExpenseMenuItems = useMemo(() => [
    { type: 'link', icon: Icons.Book, label: 'Cash Book', path: '/cashbook', onClick: () => handleNavigation('/cashbook') },
    { 
      type: 'link', 
      icon: Icons.DollarSign, 
      label: 'Add Expense', 
      path: '/expenses/add',
      onClick: () => handleNavigation('/expenses/add')
    },
    { 
      type: 'link',
      icon: Icons.DollarSign, 
      label: 'Cash Adjustments', 
      path: '/cash-adjustments',
      onClick: () => handleNavigation('/cash-adjustments')
    },
  ], [handleNavigation]);

  const expenseMenuItems = useMemo(
    () => filterByPermission(activeUser, allExpenseMenuItems),
    [activeUser, allExpenseMenuItems]
  );

  // Props to pass down to both Desktop and Mobile Sidebars
  const commonSidebarProps = {
    user: activeUser,
    handleLogout,
    handleNavigation,
    mainMenuItems,
    dataMenuItems,
    expenseMenuItems,
    canAccessSettings: canAccessPathFor(activeUser, '/settings'),
    hasAnyDataItem: dataMenuItems.length > 0,
    hasAnyExpenseItem: expenseMenuItems.length > 0,
    isActive,
    isDataOpen,
    setIsDataOpen,
    isExpensesOpen,
    setIsExpensesOpen,
    onExpenseItemClick: handleExpenseClick, // Pass the handler
  };

  return (
    <>
      <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
        <SidebarDesktop {...commonSidebarProps} />
        <SidebarMobile {...commonSidebarProps} />
      </IconContext.Provider>
    </>
  );
});

export default Sidebar;
