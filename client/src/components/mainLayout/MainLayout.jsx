import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../sidebar/Sidebar';
import MainContent from './MainContent';
import { useUser } from '../UserInterface/UserContext';

const MainLayout = ({ setLoggedIn }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useUser();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        open={isSidebarOpen}
        setOpen={setIsSidebarOpen}
        animate={true}
        user={user}
        setLoggedIn={setLoggedIn}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Toaster 
          position="top-right"
          toastOptions={{
            className: '!bg-white !text-gray-800 !shadow-lg !border !border-gray-200',
            success: {
              className: '!bg-green-50 !text-green-700 !border-green-200',
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              className: '!bg-red-50 !text-red-700 !border-red-200',
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }}
        />
        <div className="flex-1 overflow-y-auto">
          <MainContent />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
