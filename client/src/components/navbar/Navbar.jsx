import React from 'react';
import LogoSection from './LogoSection';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';

const Navbar = ({ onToggleSidebar, isSidebarOpen, setLoggedIn, user }) => {
  return (
    <nav className="bg-white border-b border-amber-100 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <LogoSection onToggleSidebar={onToggleSidebar} />

          <div className="flex items-center">
            <NotificationDropdown />
            <UserMenu user={user} setLoggedIn={setLoggedIn} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;