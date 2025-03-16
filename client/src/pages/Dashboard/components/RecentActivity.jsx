import React from 'react';

const ActivityIcon = ({ type }) => {
  const iconClass = {
    token: "bg-green-100 text-green-600",
    expense: "bg-red-100 text-red-600",
    exchange: "bg-blue-100 text-blue-600",
    entry: "bg-purple-100 text-purple-600"
  }[type] || "bg-gray-100 text-gray-600";

  const icon = {
    token: "₹",
    expense: "-",
    exchange: "↔",
    entry: "+"
  }[type] || "•";

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconClass}`}>
      {icon}
    </div>
  );
};

const RecentActivity = ({ activities = [] }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-yellow-900">Today's Activity</h3>
      <span className="text-sm text-gray-500">
        {new Date().toLocaleDateString('en-IN', { 
          day: 'numeric',
          month: 'short'
        })}
      </span>
    </div>
    <div className="overflow-y-auto max-h-[400px]">
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-gray-500">No activities recorded today</p>
            <p className="text-xs text-gray-400 mt-1">New activities will appear here</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start space-x-4 p-3 hover:bg-yellow-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-yellow-100"
            >
              <ActivityIcon type={activity.type} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  {activity.amount !== 0 && (
                    <span className={`text-sm font-medium ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.amount > 0 ? '₹' : '-₹'}{Math.abs(activity.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">{activity.details}</span>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default RecentActivity;