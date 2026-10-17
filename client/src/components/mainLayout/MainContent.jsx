import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SimpleTransition from '../transitions/SimpleTransition';
import { AppearanceAreaContext, areaForPath } from '../../lib/appearance';

const MainContent = () => {
  const location = useLocation();
  const area = areaForPath(location.pathname);

  return (
    <main data-app-area={area} className="flex-1 min-h-full bg-page overflow-y-auto">
      <AppearanceAreaContext.Provider value={area}>
        <AnimatePresence mode="wait">
          <SimpleTransition />
        </AnimatePresence>
        <div className="container mx-auto h-full">
          <Outlet />
        </div>
      </AppearanceAreaContext.Provider>
    </main>
  );
};

export default MainContent;
