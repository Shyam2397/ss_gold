import React, { useEffect, useRef, useState, Suspense } from 'react';
import { ActivitySkeleton } from './LoadingSkeleton';
import SimpleList from './SimpleList';
import ActivityIcon from './ActivityIcon';

// Lazy load react-window
const FixedSizeList = React.lazy(() => import('react-window').then(mod => ({ 
  default: mod.FixedSizeList 
})));

const ActivityRow = React.memo(({ data, index, style }) => {
  const activity = data[index];
  return (
    <div style={style}>
      <div className="flex items-start space-x-4 p-3 hover:bg-yellow-50 rounded-lg transition-colors duration-200">
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
    </div>
  );
});

const RecentActivity = ({ activities = [], loading = false }) => {
  const [listHeight, setListHeight] = useState(350);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const windowHeight = window.innerHeight;
        const containerTop = containerRef.current.getBoundingClientRect().top;
        const newHeight = Math.max(350, windowHeight - containerTop - 100);
        setListHeight(newHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm" ref={containerRef}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-yellow-900">Today's Activity</h3>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-IN', { 
            day: 'numeric',
            month: 'short'
          })}
        </span>
      </div>
      <div className="w-full" style={{ height: listHeight }}>
        <Suspense fallback={<SimpleList data={activities} rowComponent={ActivityRow} height={listHeight} />}>
          <FixedSizeList
            height={listHeight}
            itemCount={activities.length}
            itemSize={80}
            width="100%"
            itemData={activities}
          >
            {ActivityRow}
          </FixedSizeList>
        </Suspense>
      </div>
    </div>
  );
};

export default React.memo(RecentActivity);