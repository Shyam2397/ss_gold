import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CurrencyRupeeIcon, ExclamationCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { debounce } from 'lodash';
import { FixedSizeList as List } from 'react-window';
import { CustomerSkeleton } from './LoadingSkeleton';

const CustomerRow = ({ data, index, style }) => {
  const customer = data[index];
  return (
    <div style={style}>
      <div 
        key={customer.id}
        className="flex items-start space-x-4 p-3 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-red-100"
      >
        <div className="p-2 bg-red-100 rounded-full">
          <CurrencyRupeeIcon className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                #{customer.tokenNo}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                Code: {customer.code}
              </span>
            </div>
            <span className="text-sm font-medium text-red-600">
              ₹{customer.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">{customer.test}</span>
            <span className="text-xs text-gray-400">
              {customer.date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnpaidCustomers = ({ tokens = [], loading = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [listHeight, setListHeight] = useState(350);
  const containerRef = useRef(null);

  const debouncedSearch = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const unpaidCustomers = useMemo(() => tokens
    .filter(token => !token.isPaid)
    .map(token => ({
      id: token._id,
      name: token.name,
      amount: parseFloat(token.amount) || 0,
      date: new Date(token.date),
      test: token.test || 'Token',
      code: token.code || '-',
      tokenNo: token.tokenNo || '-'
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()));

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return unpaidCustomers;
    const query = searchQuery.toLowerCase();
    return unpaidCustomers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.code.toLowerCase().includes(query)
    );
  }, [unpaidCustomers, searchQuery]);

  const totalUnpaid = filteredCustomers.reduce((sum, customer) => sum + customer.amount, 0);

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
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <CustomerSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm" ref={containerRef}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-yellow-900">Unpaid Customers</h3>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-yellow-600" aria-hidden="true" />
            </div>
            <input
              type="text"
              onChange={(e) => debouncedSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="block w-44 rounded-md border border-yellow-200 bg-white pl-10 py-1 text-sm text-yellow-900 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 truncate"
            />
          </div>
          <div className="flex items-center text-red-600">
            <ExclamationCircleIcon className="w-5 h-5 mr-1" />
            <span className="font-semibold">₹{totalUnpaid.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="w-full" style={{ height: listHeight }}>
        <List
          height={listHeight}
          itemCount={filteredCustomers.length}
          itemSize={80}
          width="100%"
          itemData={filteredCustomers}
        >
          {CustomerRow}
        </List>
      </div>
    </div>
  );
};

export default React.memo(UnpaidCustomers);
