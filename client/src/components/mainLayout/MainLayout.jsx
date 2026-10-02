import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../sidebar/Sidebar';
import MainContent from './MainContent';
import { useUser } from '../UserInterface/UserContext';

// App.jsx remounts the whole route tree on every navigation
// (<Routes key={location.pathname}>), which resets the sidebar to its default
// open state. Keeping this outside React lets the drawer state survive the
// remount so it can actually be closed when the user navigates.
let persistedSidebarOpen = true;
let lastPathname = null;

const MainLayout = ({ setLoggedIn }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpenState] = useState(persistedSidebarOpen);
  const { user } = useUser();

  const setIsSidebarOpen = useCallback((next) => {
    persistedSidebarOpen = typeof next === 'function' ? next(persistedSidebarOpen) : next;
    setSidebarOpenState(persistedSidebarOpen);
  }, []);

  // Auto-close the sidebar when the route changes (first render is left as-is)
  useEffect(() => {
    if (lastPathname !== null && lastPathname !== location.pathname) {
      setIsSidebarOpen(false);
    }
    lastPathname = location.pathname;
  }, [location.pathname, setIsSidebarOpen]);

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
