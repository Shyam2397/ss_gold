import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
        
        <div className="flex-1 relative overflow-y-auto">
          {/* Removed motion.div for layout transition */}
          <div className="flex-1 relative overflow-y-auto">
            <MainContent key={location.pathname} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
