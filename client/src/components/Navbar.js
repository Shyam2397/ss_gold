import React from 'react';
import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Logo from '../asset/logo.png';

const Navbar = ({ onToggleSidebar, isSidebarOpen, setLoggedIn, user }) => {
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
  };

  return (
    <nav className="bg-white border-b border-amber-100 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <FiMenu className="h-6 w-6" />
            </button>

            <div className="flex items-center ml-4">
              <img src={Logo} alt="SS Gold" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-semibold text-amber-900">SS Gold</span>
            </div>
          </div>

          <div className="flex items-center">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-4 p-2 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 relative"
            >
              <FiBell className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </motion.button>

            {/* User Menu */}
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

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="ml-4 p-2 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <FiLogOut className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
