import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';

const formatCurrency = (amount) =>
  Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const EmptyState = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-400">
    {icon}
    <p className="text-xs mt-2 text-center">{message}</p>
  </div>
);

const AnalyticsPanel = ({
  activeTab,
  setActiveTab,
  categorySummary,
  monthlySummary
}) => {
  const maxCategoryAmount = useMemo(
    () => (categorySummary.length > 0 ? categorySummary[0][1] : 1),
    [categorySummary]
  );

  const tabs = useMemo(() => [
    { key: 'categorywise', label: 'Top Expenses', icon: <PieChart className="w-3.5 h-3.5" /> },
    { key: 'monthwise', label: 'Monthly Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> }
  ], []);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b bg-gray-50/50">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all relative
              ${activeTab === key
                ? 'text-amber-800 bg-white'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {icon}
            {label}
            {activeTab === key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[230px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-gray-50">
        {activeTab === 'categorywise' ? (
          categorySummary.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {categorySummary.map(([category, amount], index) => (
                <div key={category} className="p-3 hover:bg-amber-50/30 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full bg-red-400"
                        style={{ opacity: 1 - index * 0.15 }}
                      />
                      <span className="text-xs text-gray-700 font-medium">{category}</span>
                    </div>
                    <span className="text-xs font-semibold text-red-600 tabular-nums">
                      ₹ {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-300 rounded-full transition-all duration-500"
                      style={{
                        width: `${(amount / maxCategoryAmount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<PieChart className="w-8 h-8 text-gray-300" />}
              message="No expenses found for the current month"
            />
          )
        ) : (
          monthlySummary.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {monthlySummary.map((data) => {
                const total = data.income + data.expense;
                const incomeWidth = total > 0 ? (data.income / total) * 100 : 50;
                const expenseWidth = total > 0 ? (data.expense / total) * 100 : 50;
                const net = data.income - data.expense;

                return (
                  <div key={data.month} className="p-3 hover:bg-amber-50/30 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-700">{data.month}</span>
                      <span className={`text-xs font-semibold tabular-nums flex items-center gap-1 ${
                        net >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {net >= 0
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />
                        }
                        {net >= 0 ? '+' : '-'}₹ {formatCurrency(net)}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] mb-1.5">
                      <span className="text-green-600 flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        +₹ {formatCurrency(data.income)}
                      </span>
                      <span className="text-red-600 flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        -₹ {formatCurrency(data.expense)}
                      </span>
                      {data.pending > 0 && (
                        <span className="text-yellow-600">
                          ₹ {formatCurrency(data.pending)} pending
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-300 rounded-l transition-all duration-500"
                        style={{ width: `${incomeWidth}%` }}
                      />
                      <div
                        className="bg-gradient-to-r from-red-300 to-red-400 rounded-r transition-all duration-500"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="w-8 h-8 text-gray-300" />}
              message="No monthly data available"
            />
          )
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
