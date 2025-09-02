import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import PropTypes from 'prop-types';

const AnalyticsPanel = ({ 
  activeTab, 
  setActiveTab, 
  categorySummary, 
  monthlySummary 
}) => {
  // Memoize category content
  const CategoryContent = useMemo(() => (
    <List
      height={250}
      width="100%"
      itemCount={categorySummary.length}
      itemSize={60}
    >
      {({ index, style }) => {
        const [category, amount] = categorySummary[index];
        return (
          <div style={style} className="p-3 hover:bg-amber-50/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">{category}</span>
              <span className="text-xs font-medium text-red-600">
                ₹ {amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(amount / categorySummary[0][1]) * 100}%`,
                  opacity: 1 - (index * 0.15)
                }}
              />
            </div>
          </div>
        );
      }}
    </List>
  ), [categorySummary]);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('categorywise')}
          className={`flex-1 px-4 py-1 text-xs font-medium transition-colors relative
            ${activeTab === 'categorywise' ? 'text-amber-800' : 'text-gray-600'}`}
        >
          Top Expenses
          {activeTab === 'categorywise' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('monthwise')}
          className={`flex-1 px-4 py-1 text-xs font-medium transition-colors relative
            ${activeTab === 'monthwise' ? 'text-amber-800' : 'text-gray-600'}`}
        >
          Monthly Overview
          {activeTab === 'monthwise' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
          )}
        </button>
      </div>

      <div className="max-h-[250px] md:max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-gray-50">
        {activeTab === 'categorywise' ? (
          <div className="divide-y">
            {CategoryContent}
          </div>
        ) : (
          <div className="divide-y">
            {monthlySummary.map((data) => (
              <div key={data.month} className="p-3 hover:bg-amber-50/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{data.month}</span>
                  <span className={`text-xs font-medium ${
                    data.total >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.total >= 0 ? '+' : ''}
                    ₹ {Math.abs(data.total).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-green-600">+₹ {data.income.toLocaleString('en-IN')}</span>
                  <span className="text-red-600">-₹ {data.expense.toLocaleString('en-IN')}</span>
                  {data.pending > 0 && (
                    <span className="text-yellow-600">
                      ₹ {data.pending.toLocaleString('en-IN')} pending
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex gap-0.5 h-1">
                  <div className="bg-green-400 rounded-l" 
                    style={{ 
                      width: `${(data.income / Math.max(data.income + data.expense, 1)) * 100}%` 
                    }} 
                  />
                  <div className="bg-red-400 rounded-r" 
                    style={{ 
                      width: `${(data.expense / Math.max(data.income + data.expense, 1)) * 100}%` 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

AnalyticsPanel.propTypes = {
  activeTab: PropTypes.oneOf(['categorywise', 'monthwise']).isRequired,
  setActiveTab: PropTypes.func.isRequired,
  categorySummary: PropTypes.arrayOf(PropTypes.array).isRequired,
  monthlySummary: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default React.memo(AnalyticsPanel);
