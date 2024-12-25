import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../asset/logo.png';

const MainLayout = ({ setLoggedIn }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  
  const user = {
    name: "John Doe",
    profileImage: "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed inset-y-0 left-0 z-50 lg:relative"
          >
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Navbar
          setLoggedIn={setLoggedIn}
          user={user}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        {location.pathname === "/" && (
          <div className="flex justify-center items-center bg-[#FFFCF5] m-3 max-[767px]:h-screen h-full rounded-xl">
            <img
              src={Logo}
              alt="Company Logo"
              className="h-64"
            />
          </div>
        )}
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
      </div>
    </div>
  );
};

export default MainLayout;
