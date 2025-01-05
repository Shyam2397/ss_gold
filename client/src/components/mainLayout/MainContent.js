import React from 'react';
import { Outlet } from 'react-router-dom';

const MainContent = () => {
  
  return (
    <main className="h-full bg-gradient-to-br from-amber-50 to-yellow-100">
      {/* Removed AnimatePresence and motion.div for page transitions */}
      <div className="container mx-auto py-6">
        <Outlet />
      </div>
    </main>
  );
};

export default MainContent;
