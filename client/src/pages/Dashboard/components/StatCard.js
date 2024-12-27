import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, title, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white p-6 rounded-xl shadow-sm border border-${color}-100`}
  >
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        <Icon className={`h-6 w-6 text-${color}-500`} />
      </div>
      {trend && (
        <span className={`text-sm font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="mt-4 text-2xl font-bold text-gray-900">{value}</h3>
    <p className="mt-1 text-sm text-gray-500">{title}</p>
  </motion.div>
);

export default StatCard;
