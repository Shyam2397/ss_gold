import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SimpleTransition from '../transitions/SimpleTransition';

const MainContent = () => {
  return (
    <main className="flex-1 min-h-screen bg-ivory overflow-y-auto">
      <AnimatePresence mode="wait">
        <SimpleTransition />
      </AnimatePresence>
      <div className="container mx-auto h-full">
        <Outlet />
      </div>
    </main>
  );
};

export default MainContent;
