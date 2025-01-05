import React from 'react';

const CustomerDataError = ({ error }) => {
  if (!error) return null;

  return (
    // Replaced motion.div with standard div to eliminate animation
    <div
      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r"
    >
      {error}
    </div>
  );
};

export default CustomerDataError;
