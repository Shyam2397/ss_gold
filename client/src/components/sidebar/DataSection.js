import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDatabase, 
  FiChevronDown, 
  FiChevronRight 
} from 'react-icons/fi';
import MenuItem from './MenuItem';

const DataSection = ({ isActive, dataMenuItems }) => {
  const [isDataOpen, setIsDataOpen] = useState(false);

  return (
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
    </div>
  );
};

export default DataSection;
