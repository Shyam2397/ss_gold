import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiTrash } from 'react-icons/fi';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const NotificationDropdown = () => {
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

      const combinedActivities = [
        ...entriesRes.data.slice(-3).map(entry => ({
          type: 'customer',
          icon: 'users',
          title: `New Customer: ${entry.name}`,
          subtitle: `Place: ${entry.place}`,
          time: 'Recently added',
          timestamp: new Date().getTime(),
          color: 'blue'
        })),
        ...tokensRes.data.slice(-3).map(token => ({
          type: 'token',
          icon: token.test === 'Skin Testing' ? 'activity' : 'camera',
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

      const newActivities = combinedActivities.filter(
        activity => !lastViewedActivityTime || activity.timestamp > lastViewedActivityTime
      );
      setNewActivitiesCount(newActivities.length);

      setActivities(combinedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [lastViewedActivityTime]);

  const handleNewActivity = (newActivity) => {
    setActivities((prevActivities) => [...prevActivities, newActivity]);
    setNewActivitiesCount((prevCount) => prevCount + 1);
  };

  const clearNotifications = () => {
    setActivities([]);
    setNewActivitiesCount(0);
  };

  useEffect(() => {
    const fetchNewActivities = async () => {
      try {
        const response = await axios.get(`${API_URL}/new-activities`);
        const newActivities = response.data;
        newActivities.forEach(handleNewActivity);
      } catch (error) {
        console.error('Error fetching new activities:', error);
        // Optionally set a state to display an error message in the UI
      }
    };

    fetchNewActivities();
  }, []);

  useEffect(() => {
    fetchActivities();
    const intervalId = setInterval(fetchActivities, 10000);

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

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchActivities]);

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

  return (
    <div className="relative">
      <motion.button
        ref={bellButtonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 relative"
        onClick={() => {
          setShowActivities(!showActivities);
          if (!showActivities) {
            setLastViewedActivityTime(Date.now());
            setNewActivitiesCount(0);
          }
        }}
      >
        <FiBell className="h-6 w-6" />
        {newActivitiesCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
          >
            {newActivitiesCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {showActivities && (
          <motion.div
            ref={activitiesRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", bounce: 0.25 }}
            className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button
                  onClick={clearNotifications}
                  className="text-red-600 hover:text-red-800 transition duration-200"
                >
                  <FiTrash className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No new activities. Waiting for updates...
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4"
                    >
                      <div className={`p-2 rounded-lg bg-${activity.color}-50`}>
                        {activity.icon === 'users' && <FiBell className="h-5 w-5 text-blue-500" />}
                        {activity.icon === 'activity' && <FiBell className="h-5 w-5 text-purple-500" />}
                        {activity.icon === 'camera' && <FiBell className="h-5 w-5 text-pink-500" />}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.subtitle}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
