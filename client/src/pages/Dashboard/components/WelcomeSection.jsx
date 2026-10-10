import React from 'react';
import { motion } from 'framer-motion';
import TimeSelector from './TimeSelector';

const WelcomeSection = ({ period, setPeriod }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 className="text-xl font-bold text-gold-dark sm:text-2xl">Dashboard Overview</h2>
        <p className="mt-0.5 text-sm text-gold/70">
          A quick look at testing activity and performance.
        </p>
      </div>
      <TimeSelector period={period} setPeriod={setPeriod} />
    </motion.div>
  );
};

export default WelcomeSection;
