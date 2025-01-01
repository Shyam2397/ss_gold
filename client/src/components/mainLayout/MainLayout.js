import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      
        {isSidebarOpen && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}
      

      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar
          setLoggedIn={setLoggedIn}
          user={user}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          className="overflow-hidden"
        />
        
        {location.pathname === "/" && <LogoSection />}
        
        <motion.div 
          className="flex-1 relative overflow-y-auto"
          animate={{
            marginLeft: isSidebarOpen ? "0px" : "0px",
            width: "100%"
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            mass: 0.5
          }}
        >
          <MainContent key={location.pathname} />
        </motion.div>
      </div>
    </div>
  );
};

export default MainLayout;
