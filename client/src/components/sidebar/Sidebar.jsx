import React, { useState, useMemo, useCallback, memo, useEffect, useRef, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { Icons } from './SidebarIcons';
import { throttle } from "../../lib/utils";
import { SCROLL_BEHAVIOR } from '../../routes';
import { SidebarProvider, useSidebar } from './SidebarProvider';
import { SidebarDesktop } from './SidebarDesktop';
import { SidebarMobile } from './SidebarMobile';

// Lazy load modals
const AddExpense = React.lazy(() => import('../expenses/AddExpense'));
const MasterExpense = React.lazy(() => import('../expenses/MasterExpense'));
const ViewExpense = React.lazy(() => import('../expenses/ViewExpense'));

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
    { icon: Icons.Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Icons.Users, label: 'New Entries', path: '/entries' },
    { icon: Icons.Tag, label: 'Token', path: '/token' },
    { icon: Icons.TestTubes, label: 'Skin Testing', path: '/skin-testing' },
    { icon: Icons.Camera, label: 'Photo Testing', path: '/photo-testing' },
    { icon: Icons.GoldBar, label: 'Pure Exchange', path: '/pure-exchange' },
    
  ], []);

  const dataMenuItems = useMemo(() => [
    { icon: Icons.Database, label: 'Customer Data', path: '/customer-data' },
    { icon: Icons.Database, label: 'Token Data', path: '/token-data' },
    { icon: Icons.Database, label: 'Skin Test Data', path: '/skintest-data' },
    { icon: Icons.Database, label: 'Exchange Data', path: '/exchange-data' },
  ], []);

  const handleExpenseClick = useCallback((item) => {
    if (item.modalSetter) {
      item.modalSetter(true);
      setIsExpensesOpen(false);
      if (animate) setOpen(false);
    } else if (item.onClick) {
      item.onClick();
      setIsExpensesOpen(false);
      if (animate) setOpen(false);
    }
  }, [animate, setOpen]);
  
  // Define modal setters for expense items
  const expenseModalSetters = useMemo(() => ({
    add: setShowAddExpense,
    master: setShowMasterExpense,
    view: setShowViewExpense,
  }), []);

  const expenseMenuItems = useMemo(() => [
    { type: 'link', icon: Icons.Book, label: 'Cash Book', path: '/cashbook',onClick: () => handleNavigation('/cashbook') },
    { icon: Icons.DollarSign, label: 'Add Expense', modalSetter: expenseModalSetters.add },
    { icon: Icons.DollarSign, label: 'Master Expense', modalSetter: expenseModalSetters.master },
    { icon: Icons.DollarSign, label: 'View Expenses', modalSetter: expenseModalSetters.view },
    { 
      type: 'link',
      icon: Icons.DollarSign, 
      label: 'Cash Adjustments', 
      path: '/cash-adjustments',
      onClick: () => handleNavigation('/cash-adjustments')
    },
  ], [expenseModalSetters, handleNavigation]);

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

  // Add performance monitoring
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log(`${entry.name}: ${entry.duration}`);
      });
    });
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
        <SidebarDesktop {...commonSidebarProps} />
        <SidebarMobile {...commonSidebarProps} />
      </IconContext.Provider>

      {/* Wrap modals with Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        {showAddExpense && <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />}
        {showMasterExpense && <MasterExpense isOpen={showMasterExpense} onClose={() => setShowMasterExpense(false)} />}
        {showViewExpense && <ViewExpense isOpen={showViewExpense} onClose={() => setShowViewExpense(false)} />}
      </Suspense>
    </>
  );
});

export default memo(Sidebar);
