import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiUsers,
  FiTag,
  FiCamera,
  FiDatabase,
  FiChevronDown,
  FiChevronRight,
  FiSettings
} from 'react-icons/fi';
import { GiTestTubes } from 'react-icons/gi';

const MenuItem = ({ icon: Icon, label, to, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-amber-100 text-amber-900'
        : 'text-gray-600 hover:bg-amber-50 hover:text-amber-900'
    }`}
  >
    <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : ''}`} />
    <span className="font-medium">{label}</span>
  </Link>
);

const MenuSection = ({ title, children }) => (
  <div className="py-4">
    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
      {title}
    </h3>
    <nav className="space-y-1">{children}</nav>
  </div>
);

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [isDataOpen, setIsDataOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const mainMenuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiUsers, label: 'New Entries', path: '/entries' },
    { icon: FiTag, label: 'Token', path: '/token' },
    { icon: GiTestTubes, label: 'Skin Testing', path: '/skin-testing' },
    { icon: FiCamera, label: 'Photo Testing', path: '/photo-testing' },
  ];

  const dataMenuItems = [
    { icon: FiDatabase, label: 'Customer Data', path: '/customer-data' },
    { icon: FiDatabase, label: 'Token Data', path: '/token-data' },
    { icon: FiDatabase, label: 'Skin Test Data', path: '/skintest-data' },
  ];

  return (
    <div className={`h-screen bg-white border-r border-amber-100 shadow-sm w-64 flex-shrink-0 ${isOpen ? '' : 'hidden'}`}>
      <div className="flex flex-col h-full">
        {/* Main Menu */}
        <MenuSection title="Main Menu">
          {mainMenuItems.map((item) => (
            <MenuItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              to={item.path}
              isActive={isActive(item.path)}
            />
          ))}
        </MenuSection>

        {/* Data Section */}
        <MenuSection title="Data Management">
          <div className="px-4">
            <button
              onClick={() => setIsDataOpen(!isDataOpen)}
              className="flex items-center justify-between w-full py-2.5 text-gray-600 hover:text-amber-900 transition-colors duration-200"
            >
              <div className="flex items-center space-x-2">
                <FiDatabase className="h-5 w-5" />
                <span className="font-medium">Data</span>
              </div>
              {isDataOpen ? (
                <FiChevronDown className="h-4 w-4" />
              ) : (
                <FiChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {isDataOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-4"
              >
                {dataMenuItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    to={item.path}
                    isActive={isActive(item.path)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </MenuSection>

        {/* Settings Section */}
        <MenuSection title="Settings">
          <MenuItem
            icon={FiSettings}
            label="Settings"
            to="/settings"
            isActive={isActive('/settings')}
          />
        </MenuSection>

        {/* Version Info */}
        <div className="mt-auto p-4 border-t border-amber-100">
          <div className="text-xs text-gray-500">
            <p>Version 1.0.0</p>
            <p className="mt-1"> 2024 SS Gold</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
