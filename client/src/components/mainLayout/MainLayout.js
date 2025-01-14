import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import MainContent from './MainContent';

const MainLayout = ({ setLoggedIn }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  
  const user = {
    name: "John Doe",
    profileImage: "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        open={isSidebarOpen}
        setOpen={setIsSidebarOpen}
        animate={true}
        user={user}
        setLoggedIn={setLoggedIn}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <MainContent key={location.pathname} />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
