import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMenu, FiBell, FiLogOut, FiUsers, FiActivity, FiCamera } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Logo from '../asset/logo.png';

const API_URL = 'http://localhost:5000';

const Navbar = ({ onToggleSidebar, isSidebarOpen, setLoggedIn, user }) => {
  const [showActivities, setShowActivities] = useState(false);
  const [activities, setActivities] = useState([]);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const [lastViewedActivityTime, setLastViewedActivityTime] = useState(null);
  const activitiesRef = useRef(null);
  const bellButtonRef = useRef(null);

  const fetchActivities = useCallback(async () => {
    try {
      const [entriesRes, tokensRes] = await Promise.all([
        axios.get(`${API_URL}/entries`),
        axios.get(`${API_URL}/tokens`)
      ]);

      // Combine and sort activities
      const combinedActivities = [
        ...entriesRes.data.slice(-3).map(entry => ({
          type: 'customer',
          icon: <FiUsers className="h-5 w-5 text-blue-500" />,
          title: `New Customer: ${entry.name}`,
          subtitle: `Place: ${entry.place}`,
          time: 'Recently added',
          timestamp: new Date().getTime(),
          color: 'blue'
        })),
        ...tokensRes.data.slice(-3).map(token => ({
          type: 'token',
          icon: token.test === 'Skin Testing' ? 
            <FiActivity className="h-5 w-5 text-purple-500" /> : 
            <FiCamera className="h-5 w-5 text-pink-500" />,
          title: `${token.test}: ${token.name}`,
          subtitle: `Token #${token.tokenNo}`,
          time: `${token.date} ${token.time}`,
          timestamp: new Date(`${token.date} ${token.time}`).getTime(),
          color: token.test === 'Skin Testing' ? 'purple' : 'pink'
        }))
      ]
      .sort((a, b) => {
        if (a.time === 'Recently added') return -1;
        if (b.time === 'Recently added') return 1;
        return b.timestamp - a.timestamp;
      })
      .slice(0, 4);

      // Calculate new activities count
      const newActivities = combinedActivities.filter(
        activity => !lastViewedActivityTime || activity.timestamp > lastViewedActivityTime
      );
      setNewActivitiesCount(newActivities.length);

      setActivities(combinedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [lastViewedActivityTime]);

  useEffect(() => {
    // Initial fetch
    fetchActivities();

    // Set up polling interval (every 10 seconds)
    const intervalId = setInterval(fetchActivities, 10000);

    // Handle click outside of activities dropdown
    const handleClickOutside = (event) => {
      if (
        activitiesRef.current && 
        !activitiesRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setShowActivities(false);
      }
    };

    // Add click event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup interval and event listener on component unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchActivities]);

  // Auto-close dropdown after 5 seconds of inactivity
  useEffect(() => {
    let timeoutId;
    if (showActivities) {
      timeoutId = setTimeout(() => {
        setShowActivities(false);
      }, 5000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showActivities]);

  const handleBellClick = () => {
    // Reset new activities count and update last viewed time
    setNewActivitiesCount(0);
    setLastViewedActivityTime(new Date().getTime());
    
    // Toggle dropdown visibility
    setShowActivities(!showActivities);
  };

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
            <div className="relative">
              <motion.button
                ref={bellButtonRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBellClick}
                className="ml-4 p-2 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 relative"
              >
                <FiBell className="h-6 w-6" />
                {newActivitiesCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white">
                    {newActivitiesCount > 9 ? '9+' : newActivitiesCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showActivities && (
                  <motion.div
                    ref={activitiesRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4"
                          >
                            <div className={`p-2 rounded-lg bg-${activity.color}-50`}>
                              {activity.icon}
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.subtitle}</p>
                              <p className="text-xs text-gray-400">{activity.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
