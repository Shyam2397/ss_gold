import React from 'react';
import { FiLogOut } from 'react-icons/fi';

const UserMenu = ({ user, setLoggedIn }) => {
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
  };

  return (
    <div className="ml-4 relative flex items-center">
      <div className="flex items-center">
        <img
          className="h-8 w-8 rounded-full object-cover border-2 border-amber-200"
          src={user?.profileImage || 'https://via.placeholder.com/40'}
          alt="User"
        />
        <span className="hidden md:block ml-2 text-sm font-medium text-gray-700">
          {user?.name || 'User'}
        </span>
      </div>

      <button
        onClick={handleLogout}
        className="ml-4 p-2 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <FiLogOut className="h-5 w-5" />
      </button>
    </div>
  );
};

export default UserMenu;
