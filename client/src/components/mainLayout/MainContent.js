import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

const MainContent = () => {
  const location = useLocation();
  
  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-amber-50 to-yellow-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ 
            opacity: 0,
            x: 100,
            scale: 0.92,
            rotate: 2
          }}
          animate={{ 
            opacity: 1,
            x: 0,
            scale: 1,
            rotate: 0
          }}
          exit={{ 
            opacity: 0,
            x: -100,
            scale: 0.92,
            rotate: -2
          }}
          transition={{
            opacity: { duration: 0.3, ease: "easeInOut" },
            scale: { type: "spring", stiffness: 100, damping: 15, mass: 0.5 },
            rotate: { type: "spring", stiffness: 120, damping: 20 },
            x: { type: "spring", stiffness: 80, damping: 15 }
          }}
          className="container mx-auto py-6"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default MainContent;
