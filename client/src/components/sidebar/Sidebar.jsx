import React, { useState, useMemo, useCallback, memo, useEffect, useRef, createContext, useContext } from 'react';
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
import { cn, throttle } from "../../lib/utils";
import Logo from '../../asset/logo.png';
import { SCROLL_BEHAVIOR } from '../../routes';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ErrorBoundary from '../common/ErrorBoundary';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useNavigation } from '../navigation/NavigationContext';

const NAVIGATION_DEBOUNCE = 300;
const HOVER_DELAY = 50;

// Create sidebar context
const SidebarContext = createContext();

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

// Sidebar provider component
const SidebarProvider = memo(({ children, openProp, setOpenProp, animate = true }) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  // Optimize re-renders
  const contextValue = useMemo(() => ({
    open, 
    setOpen,
    animate
  }), [open, setOpen, animate]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
});

// Motion variants
const sidebarVariants = {
  expanded: {
    width: "260px",
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  collapsed: {
    width: "70px",
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }
};

const labelVariants = {
  visible: { 
    opacity: 1, 
    display: "block",
    transition: { duration: 0.2 }
  },
  hidden: { 
    opacity: 0, 
    display: "none",
    transition: { duration: 0.2 }
  }
};

// Define components before they are used
const MenuSection = memo(({ children }) => (
  <div className="py-0.5">
    <nav className="space-y-1 px-3.5">{children}</nav>
  </div>
));

// Update MenuItem component
const MenuItem = memo(({ icon: Icon, label, to, isActive, onClick, handleNavigation }) => {
  const { open } = useSidebar();
  
  return (
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
      <motion.span
        variants={labelVariants}
        animate={open ? "visible" : "hidden"}
        className="font-medium text-md ml-3 whitespace-nowrap"
      >
        {label}
      </motion.span>
    </Link>
  );
});

// Add VirtualizedMenuItems component
const VirtualizedMenuItems = memo(({ items, itemHeight = 32, renderItem }) => {
  if (items.length <= 10) {
    return items.map(renderItem);
  }

  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem(items[index])}
    </div>
  );

  return (
    <div style={{ height: Math.min(items.length * itemHeight, 320) }}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            overscanCount={5}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
});

const Sidebar = ({ open: openProp, setOpen: setOpenProp, animate = true, user, setLoggedIn }) => {
  return (
    <SidebarProvider openProp={openProp} setOpenProp={setOpenProp} animate={animate}>
      <SidebarContent user={user} setLoggedIn={setLoggedIn} />
    </SidebarProvider>
  );
};

const PREFETCH_ROUTES = ['/dashboard', '/entries', '/token', '/customer-data'];

const SidebarContent = memo(({ user, setLoggedIn }) => {
  const { open, setOpen, animate } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { startLoading, stopLoading, isLoading } = useNavigation();
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMasterExpense, setShowMasterExpense] = useState(false);
  const [showViewExpense, setShowViewExpense] = useState(false);
  const [showCashBook, setShowCashBook] = useState(false);
  const scrollPositionsRef = useRef(new Map());
  const expandTimeoutRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeout = useRef(null);
  const lastNavigationTime = useRef(0);

  const sidebarRef = useResizeObserver(({ width }) => {
    if (!isAnimatingRef.current) {
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    }
  });

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

  // Enhanced navigation handling with debounce
  const handleNavigation = useCallback((to) => {
    if (isNavigating || isLoading) return;

    const now = Date.now();
    if (now - lastNavigationTime.current < NAVIGATION_DEBOUNCE) return;
    
    clearTimeout(navigationTimeout.current);
    navigationTimeout.current = setTimeout(() => {
      lastNavigationTime.current = now;
      
      const performNavigation = async () => {
        startLoading(to);
        setIsNavigating(true);
        
        try {
          const scrollBehavior = SCROLL_BEHAVIOR[to];
          if (scrollBehavior?.maintainScroll) {
            const savedPosition = scrollPositionsRef.current.get(to) ?? 0;
            await queueMicrotask(() => {
              requestAnimationFrame(() => {
                navigate(to);
                window.scrollTo({ top: savedPosition, behavior: 'instant' });
              });
            });
          } else {
            window.scrollTo(0, 0);
            navigate(to);
          }
        } finally {
          stopLoading();
          setIsNavigating(false);
        }
      };

      performNavigation();
    }, HOVER_DELAY);
  }, [navigate, isNavigating, startLoading, stopLoading, isLoading]);

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

  const renderMenuItem = useCallback((item) => (
    <MenuItem
      key={item.path}
      icon={item.icon}
      label={open ? item.label : ""}
      to={item.path}
      isActive={isActive(item.path)}
      handleNavigation={handleNavigation}
    />
  ), [open, isActive, handleNavigation]);

  const memoizedSidebarContent = useMemo(() => (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Main Menu */}
      <MenuSection>
        <VirtualizedMenuItems 
          items={mainMenuItems}
          renderItem={renderMenuItem}
        />
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
                <VirtualizedMenuItems
                  items={dataMenuItems}
                  renderItem={renderMenuItem}
                />
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
              <VirtualizedMenuItems
                items={expenseMenuItems}
                renderItem={(item) => (
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
                )}
              />
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

  // Enhanced hover handling
  const handleMouseEnter = useCallback(() => {
    if (!animate || isAnimatingRef.current) return;
    clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 50);
  }, [animate, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!animate) return;
    clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, [animate, setOpen]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(navigationTimeout.current);
      clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  // Optimized transition settings
  const sidebarTransition = useMemo(() => ({
    type: "tween",
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1],
    onStart: () => {
      isAnimatingRef.current = true;
    },
    onComplete: () => {
      isAnimatingRef.current = false;
    }
  }), []);

  // Prevent content reflow during animation
  const contentStyle = useMemo(() => ({
    willChange: 'width',
    backfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'subpixel-antialiased'
  }), []);

  // Add prefetching logic
  useEffect(() => {
    const controller = new AbortController();
    
    const prefetchRoutes = async () => {
      try {
        await Promise.all(
          PREFETCH_ROUTES.map(route => 
            fetch(route, { signal: controller.signal })
          )
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Prefetch error:', error);
        }
      }
    };

    prefetchRoutes();
    return () => controller.abort();
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        ref={sidebarRef}
        className={cn(
          "h-screen border-r border-gray-200 hidden md:flex md:flex-col bg-white overflow-hidden",
          "transform-gpu", // Force GPU acceleration
          open ? "w-80" : "w-20"
        )}
        style={contentStyle}
        variants={sidebarVariants}
        animate={open ? "expanded" : "collapsed"}
        initial={false} // Disable initial animation
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
        <ErrorBoundary>
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
        </ErrorBoundary>
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
});

export default memo(Sidebar);
