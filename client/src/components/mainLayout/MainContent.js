import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

const MainContent = () => {
  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-amber-50 to-yellow-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-6"
      >
        <Outlet />
      </motion.div>
    </main>
  );
};

export default MainContent;
