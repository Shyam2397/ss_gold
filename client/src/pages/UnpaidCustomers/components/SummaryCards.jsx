import React from 'react';
import { AlertCircle, Users, TrendingUp } from 'lucide-react';

const SummaryCards = ({ totalUnpaid, totalInvoices, customerCount }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Outstanding',
      value: formatCurrency(totalUnpaid),
      icon: TrendingUp,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      description: 'Pending amount to collect'
    },
    {
      title: 'Total Invoices',
      value: totalInvoices,
      icon: AlertCircle,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      description: 'Unpaid transactions'
    },
    {
      title: 'Unpaid Customers',
      value: customerCount,
      icon: Users,
      gradient: 'from-[#D3B04D] to-[#DD845A]',
      bgGradient: 'from-amber-50 to-orange-100',
      iconBg: 'bg-gradient-to-br from-[#D3B04D] to-[#DD845A]',
      description: 'Customers with pending dues'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div 
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${card.bgGradient} rounded-xl border border-white/20 p-3 shadow-sm hover:shadow transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{card.title}</p>
                <h3 className="text-lg font-bold text-gray-900">
                  {card.value}
                </h3>
              </div>
              <div className={`p-2 rounded-md ${card.iconBg} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
