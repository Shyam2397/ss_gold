import React, { useMemo } from 'react';
import { ArrowUp, ArrowDown, CircleDollarSign } from 'lucide-react';
import PropTypes from 'prop-types';

const BalanceSummary = ({ cashInfo }) => {
  const formatAmount = (amount) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const summaryItems = useMemo(() => [
    {
      label: 'Opening Balance',
      value: cashInfo.openingBalance,
      type: 'neutral',
      className: 'pb-0'
    },
    {
      label: 'Opening Pending',
      value: cashInfo.openingPending,
      type: 'pending',
      className: 'text-[11px] pb-2 border-b',
      isSmall: true
    },
    {
      label: 'Income',
      value: cashInfo.totalIncome,
      type: 'income',
      icon: <ArrowUp className="w-3 h-3 text-green-500" />
    },
    {
      label: 'Expense',
      value: cashInfo.totalExpense,
      type: 'expense',
      icon: <ArrowDown className="w-3 h-3 text-red-500" />
    },
    {
      label: 'Current Pending',
      value: cashInfo.totalPending - cashInfo.openingPending,
      type: 'pending',
      className: 'text-[11px]',
      isSmall: true
    },
    {
      label: 'Net Change',
      value: cashInfo.netChange,
      type: cashInfo.netChange >= 0 ? 'income' : 'expense',
      showSign: true,
      className: 'border-t pt-2'
    },
    {
      label: 'Closing Balance',
      value: cashInfo.closingBalance,
      type: 'total',
      className: 'border-t pt-2 mt-1 bg-amber-50/50 -mx-3 px-3 py-1.5 font-medium'
    }
  ], [cashInfo]);

  const getAmountColor = (type) => {
    switch (type) {
      case 'income': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'total': return 'text-amber-600 font-semibold';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="py-1 px-3 md:py-2 border-b bg-gradient-to-r from-amber-500 to-amber-400 flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">Balance Summary</h3>
        <CircleDollarSign className="w-4 h-4 text-white/70" />
      </div>
      
      <div className="p-3 space-y-1.5 text-xs">
        {summaryItems.map(({ label, value, type, icon, showSign, className = '', isSmall }) => (
          <div key={label} className={`flex justify-between items-center ${className}`}>
            <span className={`${isSmall ? 'text-yellow-600' : 'text-gray-600'}`}>{label}</span>
            <div className="flex items-center gap-1">
              {icon}
              <span className={`tabular-nums tracking-tight ${getAmountColor(type)}`}>
                {showSign && value > 0 ? '+' : ''}
                ₹ {formatAmount(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

BalanceSummary.propTypes = {
  cashInfo: PropTypes.shape({
    openingBalance: PropTypes.number.isRequired,
    openingPending: PropTypes.number.isRequired,
    totalIncome: PropTypes.number.isRequired,
    totalExpense: PropTypes.number.isRequired,
    totalPending: PropTypes.number.isRequired,
    netChange: PropTypes.number.isRequired,
    closingBalance: PropTypes.number.isRequired,
  }).isRequired
};

export default React.memo(BalanceSummary);
