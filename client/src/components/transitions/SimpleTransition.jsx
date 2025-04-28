import React, { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { SCROLL_BEHAVIOR } from '../../routes';

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

// Optimize transition variants
const pageTransitionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const SimpleTransition = memo(({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Only force scroll to top for routes that don't maintain scroll
    if (!SCROLL_BEHAVIOR[location.pathname]?.maintainScroll) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="page-transition"
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.15, // Reduced duration
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

export default SimpleTransition;
