import React from 'react';

const RecentActivity = ({ activities }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-yellow-900 mb-4">Recent Activity</h3>
    <div className="overflow-x-auto">
      <div className="min-w-full divide-y divide-yellow-200">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 hover:bg-yellow-50 px-2 rounded"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <span className="text-sm font-medium text-yellow-900">{activity.action}</span>
              <span className="text-xs text-yellow-600 mt-1 sm:mt-0">{activity.time}</span>
            </div>
            {activity.amount > 0 && (
              <span className="text-sm text-yellow-600 mt-1 sm:mt-0">
                ₹{activity.amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default RecentActivity;