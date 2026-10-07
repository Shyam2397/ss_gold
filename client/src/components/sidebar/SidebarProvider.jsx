import React, { useState, useCallback, useEffect, useMemo, createContext, useContext, memo } from 'react';

// Create sidebar context
export const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

// Sidebar provider component
export const SidebarProvider = memo(({ children, openProp, setOpenProp, animate = true }) => {
  const hasOpenProp = openProp !== undefined;
  const hasSetter = typeof setOpenProp === 'function';

  // Controlled only when BOTH a value and a setter are supplied. A lone prop or
  // setter would otherwise produce a read-only sidebar that silently ignores
  // clicks, so it is treated as uncontrolled instead. The internal state is
  // seeded from openProp so a parent's initial value is still respected.
  const isControlled = hasOpenProp && hasSetter;
  const [internalOpen, setInternalOpen] = useState(() => Boolean(openProp));

  // Desktop expand/collapse and the mobile drawer are independent states, so
  // navigating on one viewport does not clobber persistence on the other.
  const [mobileOpen, setMobileOpen] = useState(false);

  const setOpen = useCallback((next) => {
    if (hasSetter) setOpenProp(next);
    if (!isControlled) {
      setInternalOpen((prev) => (typeof next === 'function' ? next(prev) : next));
    }
  }, [isControlled, hasSetter, setOpenProp]);

  const open = isControlled ? openProp : internalOpen;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && hasOpenProp !== hasSetter) {
      console.warn(
        'SidebarProvider: pass both `openProp` and `setOpenProp` to control the sidebar. ' +
        'A partial set of control props is ignored and the sidebar stays uncontrolled.'
      );
    }
  }, [hasOpenProp, hasSetter]);

  const value = useMemo(
    () => ({ open, setOpen, mobileOpen, setMobileOpen, animate }),
    [open, setOpen, mobileOpen, animate]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
});