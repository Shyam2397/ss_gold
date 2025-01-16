import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import CurveTransition from '../transitions/CurveTransition';

const MainContent = () => {
  
  const location = useLocation();
  
  return (
    <main className="flex-1 min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 overflow-auto">
      <AnimatePresence mode="wait">
        <CurveTransition key={location.pathname} />
      </AnimatePresence>
      <div className="container mx-auto h-full">
        <Outlet />
      </div>
    </main>
  );
};

export default MainContent;
