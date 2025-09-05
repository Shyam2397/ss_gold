import React from 'react';

const ActivityIcon = ({ type, isCredit }) => {
  const iconClass = {
    token: "bg-green-100 text-green-600",
    expense: "bg-red-100 text-red-600",
    exchange: "bg-blue-100 text-blue-600",
    entry: "bg-purple-100 text-purple-600",
    adjustment: isCredit ? "bg-teal-100 text-teal-600" : "bg-orange-100 text-orange-600"
  }[type] || "bg-gray-100 text-gray-600";

  const icon = {
    token: "₹",
    expense: "-",
    exchange: "↔",
    entry: "+",
    adjustment: isCredit ? "↑" : "↓"
  }[type] || "•";

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconClass}`}>
      {icon}
    </div>
  );
};

export default React.memo(ActivityIcon);
