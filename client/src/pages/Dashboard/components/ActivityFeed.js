import React from 'react';
import { format } from 'date-fns';

const ActivityFeed = ({ activities }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className={`p-2 rounded-full ${activity.iconBg}`}>
            {activity.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">{format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
