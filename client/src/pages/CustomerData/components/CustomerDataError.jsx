import React from 'react';

const CustomerDataError = ({ error }) => {
  if (!error) return null;

  return (
    // Replaced motion.div with standard div to eliminate animation
    <div
      className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-3 rounded-r text-sm"
    >
      {error}
    </div>
  );
};

export default CustomerDataError;
