import React, { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { SCROLL_BEHAVIOR } from '../../routes';
import { useNavigation } from '../navigation/NavigationContext';

const routes = {
    "/": "Login",
    "/dashboard": "Dashboard",
    "/entries": "New Entries",
    "/token": "Token",
    "/skin-testing": "Skin Testing",
    "/photo-testing": "Photo Testing",
    "/customer-data": "Customer Data",
    "/token-data": "Token Data",
    "/skintest-data": "Skin Test Data",
    "/pure-exchange": "Pure Exchange",
    "/exchange-data": "Exchange Data"
};

// Enhanced transition variants with route-specific animations
const getTransitionVariants = (pathname) => {
  // Data views use slide transitions
  if (pathname.includes('data')) {
    return {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };
  }
  
  // Form routes use scale transitions
  if (['/entries', '/token', '/skin-testing'].includes(pathname)) {
    return {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.02 }
    };
  }
  
  // Default fade transitions
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };
};

const SimpleTransition = memo(({ children }) => {
  const { isLoading, progress, error, retryNavigation } = useNavigation();
  const location = useLocation();

  useEffect(() => {
    if (!SCROLL_BEHAVIOR[location.pathname]?.maintainScroll) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const variants = getTransitionVariants(location.pathname);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button onClick={retryNavigation} className="px-4 py-2 bg-amber-100 rounded">
          Retry Navigation
        </button>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-amber-500 z-50">
          <div 
            className="h-full bg-amber-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="page-transition"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
});

export default SimpleTransition;
