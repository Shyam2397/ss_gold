import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import LogoSection from './LogoSection';
import MainContent from './MainContent';

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
        
        {location.pathname === "/" && <LogoSection />}
        <MainContent />
      </div>
    </div>
  );
};

export default MainLayout;
