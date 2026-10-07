import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Phone, CreditCard, Printer } from 'lucide-react';
import { printCustomerStatement } from '../utils/printUtils';

const CustomerGroup = ({
  code,
  customers,
  totalAmount,
  customerName,
  customerPhone,
  isExpanded,
  onToggle,
  isVanishing
}) => {
  const [printStatus, setPrintStatus] = useState('');
  // A statement is physical paper, so a double-click must not produce two
  // receipts. `disabled` alone would not help, since it only applies after a
  // re-render.
  const isPrintingRef = useRef(false);

  const handlePrint = async (event) => {
    event.stopPropagation();
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setPrintStatus('Printing…');

    try {
      const outcome = await printCustomerStatement({
        customerName,
        customerPhone,
        code,
        totalAmount,
        entries: customers
      });

      setPrintStatus(outcome.confirmed ? 'Printed' : 'Printed (check printer)');
    } catch (error) {
      console.error('Print error:', error);
      setPrintStatus('Print failed');
    } finally {
      isPrintingRef.current = false;
      setTimeout(() => setPrintStatus(''), 3000);
    }
  };

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
    <li
      className={`hover:bg-amber-100 transition-colors duration-200${isVanishing ? ' vanish-out' : ''}`}
    >
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
              <span className="flex items-center space-x-1 text-xs text-green-600">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{customerPhone}</span>
              </span>
            </div>
            
            {/* Invoices - 2/12 */}
            <div className="hidden sm:block col-span-2">
              <span className="flex items-center space-x-1 text-xs text-blue-600 whitespace-nowrap">
                <CreditCard className="h-3 w-3 flex-shrink-0" />
                <span>{customers.length} {customers.length === 1 ? 'invoice' : 'invoices'}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Amount, Print, and Chevron */}
        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-red-600 whitespace-nowrap">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            onClick={handlePrint}
            disabled={printStatus === 'Printing…'}
            className="p-1 text-gray-400 hover:text-[#D3B04D] transition-colors no-print disabled:opacity-50"
            title="Print Statement"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          {printStatus && (
            <span className="text-[10px] text-gray-500 whitespace-nowrap">{printStatus}</span>
          )}
          <div 
            className="text-gray-400 group-hover:text-[#D3B04D] transition-colors flex-shrink-0"
            onClick={onToggle}
          >
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
