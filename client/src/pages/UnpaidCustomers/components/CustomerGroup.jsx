import React from 'react';
import { ChevronDown, ChevronRight, Phone, CreditCard } from 'lucide-react';

const CustomerGroup = ({
  code,
  customers,
  totalAmount,
  customerName,
  customerPhone,
  isExpanded,
  onToggle
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  return (
    <li className="hover:bg-gray-50 transition-colors duration-200">
      <div 
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer group h-14"
        onClick={onToggle}
      >
        <div className="flex items-center w-full space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-[#D3B04D] to-[#DD845A] flex items-center justify-center text-white font-bold text-xs">
            {getInitials(customerName)}
          </div>
          
          {/* Customer Info - Single Line */}
          <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
            {/* Name - 4/12 */}
            <div className="col-span-4 sm:col-span-3 overflow-hidden">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#391145] transition-colors truncate">
                {customerName}
              </h3>
            </div>
            
            {/* Code - 2/12 */}
            <div className="col-span-2 sm:col-span-1">
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white whitespace-nowrap">
                {code}
              </span>
            </div>
            
            {/* Phone - 3/12 */}
            <div className="hidden sm:block col-span-3 overflow-hidden">
              <span className="flex items-center space-x-1 text-xs text-gray-500">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{customerPhone}</span>
              </span>
            </div>
            
            {/* Invoices - 2/12 */}
            <div className="hidden sm:block col-span-2">
              <span className="flex items-center space-x-1 text-xs text-gray-500 whitespace-nowrap">
                <CreditCard className="h-3 w-3 flex-shrink-0" />
                <span>{customers.length} {customers.length === 1 ? 'invoice' : 'invoices'}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Amount and Chevron */}
        <div className="flex items-center space-x-3 ml-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-red-600 whitespace-nowrap">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="text-gray-400 group-hover:text-[#D3B04D] transition-colors flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default CustomerGroup;
