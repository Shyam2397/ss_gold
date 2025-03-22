import React from 'react';

const BalanceSummary = ({ cashInfo }) => {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="py-0.5 px-3 md:py-1.5 border-b bg-amber-500">
        <h3 className="text-sm font-medium text-white">Balance Summary</h3>
      </div>
      <div className="py-1 px-3 md:py-1.5 space-y-2 text-xs">
        <div className="space-y-1 pb-2 border-b">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Opening Balance</span>
            <span className="font-medium text-gray-700">
              ₹ {cashInfo.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {cashInfo.openingPending > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Opening Pending</span>
              <span className="font-medium text-yellow-600">
                ₹ {cashInfo.openingPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Income</span>
            <span className="font-medium text-green-600">
              +₹ {cashInfo.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Expense</span>
            <span className="font-medium text-red-600">
              -₹ {cashInfo.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Net Change</span>
            <span className={`font-medium ${cashInfo.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cashInfo.netChange >= 0 ? '+' : ''}
              ₹ {cashInfo.netChange.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {cashInfo.totalPending > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Pending</span>
              <span className="font-medium text-yellow-600">
                ₹ {cashInfo.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-2 mt-1 border-t">
          <span className="font-medium text-gray-700">Closing Balance</span>
          <span className="font-medium text-amber-600">
            ₹ {cashInfo.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BalanceSummary);
