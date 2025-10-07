import React, { useMemo, Suspense, lazy, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUnpaidCustomers } from '../../services/customerService';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

// Components - Group related components that should load together
const UnpaidCustomersHeader = lazy(() => import('./components/UnpaidCustomersHeader'));
const UnpaidCustomersError = lazy(() => import('./components/UnpaidCustomersError'));
const UnpaidCustomersLoader = lazy(() => import('./components/UnpaidCustomersLoader'));

// Group these components as they're usually needed together
const DashboardComponents = lazy(() => Promise.all([
  import('./components/SummaryCards'),
  import('./components/SearchBar')
]).then(([SummaryCards, SearchBar]) => ({ 
  default: function Dashboard({ summaryProps, searchProps }) {
    return (
      <>
        <SummaryCards.default {...summaryProps} />
        <SearchBar.default {...searchProps} />
      </>
    );
  }
})));

// Keep these separate as they might not be immediately visible
const CustomerGroup = lazy(() => import('./components/CustomerGroup'));
const CustomerInvoiceTable = lazy(() => import('./components/CustomerInvoiceTable'));

// Loading fallback components
const LoadingFallback = ({ className = '' }) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D3B04D]"></div>
  </div>
);

// Skeleton loader for dashboard section
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Summary Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
      ))}
    </div>
    
    {/* Search Bar Skeleton */}
    <div className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-600">Something went wrong. Please try again.</div>;
    }

    return this.props.children;
  }
}

// Wrapper component for lazy loading
const LazyComponent = ({ children, fallback = <LoadingFallback /> }) => (
  <Suspense fallback={fallback}>
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </Suspense>
);

// Import the reducer and actions
import { useUnpaidCustomers } from './reducers/unpaidCustomersReducer';

const UnpaidCustomersPage = () => {
  const [state, actions] = useUnpaidCustomers();
  const { isExporting, expandedCustomers, searchTerm } = state;

  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unpaid-customers'],
    queryFn: getUnpaidCustomers,
    staleTime: 0,              // Always consider data stale to trigger immediate refetch on mount
    gcTime: 5 * 60 * 1000,    // 5 minutes before unused data is removed from cache
    refetchOnWindowFocus: false, // Disable refetch on window focus to avoid too many requests
    refetchOnMount: 'always',  // Always refetch when the component mounts
    refetchOnReconnect: true,  // Refetch when network reconnects
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
    select: (data) => 
      data.map(customer => {
        // Format dates consistently
        const formatDate = (dateString) => {
          if (!dateString || dateString === 'N/A') return 'N/A';
          try {
            // Try to parse the date string
            const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
            return format(date, 'dd/MM/yyyy');
          } catch (e) {
            console.error('Error formatting date:', dateString, e);
            return 'N/A';
          }
        };

        return {
          ...customer,
          // Format dates and ensure consistent data types
          date: formatDate(customer.date || customer.createdAt || customer.lastPaymentDate),
          time: customer.time || 'N/A',
          // Ensure amount is a number with 2 decimal places
          outstandingBalance: parseFloat(customer.outstandingBalance || 0).toFixed(2),
          // Ensure all required fields have values
          name: customer.name || 'N/A',
          phone: customer.phone || 'N/A',
          tokenNo: customer.tokenNo || 'N/A',
          test: customer.test || 'N/A',
          code: customer.code || 'N/A'
        };
      })
  });

  // Group customers by code - memoized as it's an expensive operation
  const customersByCode = useMemo(() => {
    const grouped = {};
    customers.forEach(customer => {
      if (!grouped[customer.code]) {
        grouped[customer.code] = [];
      }
      grouped[customer.code].push(customer);
    });
    return grouped;
  }, [customers]);

  // Filter customers by search term - memoized as it involves filtering and mapping
  const filteredCustomers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return Object.entries(customersByCode)
      .filter(([code, customers]) => {
        const firstCustomer = customers[0];
        return (
          code.toLowerCase().includes(searchLower) ||
          firstCustomer.name.toLowerCase().includes(searchLower) ||
          firstCustomer.phone.toLowerCase().includes(searchLower)
        );
      })
      .map(([code, customers]) => ({
        code,
        customers,
        totalAmount: customers.reduce((sum, c) => sum + parseFloat(c.outstandingBalance || 0), 0).toFixed(2),
        customerName: customers[0].name,
        customerPhone: customers[0].phone
      }));
  }, [customersByCode, searchTerm]);

  // Calculate totals - memoized as they reduce over potentially large arrays
  const totalUnpaid = useMemo(() => {
    return filteredCustomers.reduce((sum, group) => sum + parseFloat(group.totalAmount), 0).toFixed(2);
  }, [filteredCustomers]);

  const totalInvoices = useMemo(() => {
    return filteredCustomers.reduce((sum, group) => sum + group.customers.length, 0);
  }, [filteredCustomers]);

  // Simple functions don't need useCallback
  const toggleCustomerExpansion = (code) => {
    actions.toggleCustomer(code);
  };

  const isCustomerExpanded = (code) => {
    return expandedCustomers.includes(code);
  };

  const handleExport = async () => {
    if (isExporting || filteredCustomers.length === 0) return;
    
    actions.setExporting(true);
    try {
      // Prepare data for export - flatten the grouped data
      const exportData = [];
      
      filteredCustomers.forEach(({ code, customers }) => {
        customers.forEach(customer => {
          exportData.push({
            'Code': code,
            'Token No': customer.tokenNo,
            'Customer Name': customer.name,
            'Phone': customer.phone || customer.code,
            'Test': customer.test,
            'Amount': parseFloat(customer.outstandingBalance || 0).toFixed(2),
            'Date': customer.date,
            'Time': customer.time !== 'N/A' ? customer.time : ''
          });
        });
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Unpaid Customers');
      
      // Generate Excel file
      XLSX.writeFile(wb, `unpaid-customers-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
    } finally {
      actions.setExporting(false);
    }
  };


  return (
    <div className="min-h-screen">
      <div className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl max-w-full h-full text-[#391145] m-4 border border-white/20">
        <LazyComponent>
          <UnpaidCustomersHeader 
            onExport={handleExport} 
            isExporting={isExporting} 
          />
        </LazyComponent>
        
        {error && (
          <LazyComponent>
            <UnpaidCustomersError error={error} onRetry={refetch} />
          </LazyComponent>
        )}

        {isLoading ? (
          <div className="mt-8">
            <DashboardSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardComponents 
                summaryProps={{
                  totalUnpaid,
                  totalInvoices,
                  customerCount: filteredCustomers.length
                }}
                searchProps={{
                  searchTerm,
                  onSearchChange: actions.setSearchTerm,
                  placeholder: "Search by code, name, or phone..."
                }}
              />
            </Suspense>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-lg">
              {filteredCustomers.length > 0 ? (
                <ul className="divide-y divide-gray-200/50">
                  {filteredCustomers.map(({ code, customers, totalAmount, customerName, customerPhone }) => (
                    <React.Fragment key={code}>
                      <LazyComponent>
                        <CustomerGroup
                          code={code}
                          customers={customers}
                          totalAmount={totalAmount}
                          customerName={customerName}
                          customerPhone={customerPhone}
                          isExpanded={isCustomerExpanded(code)}
                          onToggle={() => toggleCustomerExpansion(code)}
                        />
                      </LazyComponent>
                      {isCustomerExpanded(code) && (
                        <li>
                          <LazyComponent>
                            <CustomerInvoiceTable 
                              customers={customers}
                              isLoading={isLoading}
                              onPaymentStatusUpdate={refetch} 
                            />
                          </LazyComponent>
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No unpaid customers found</h3>
                  <p className="text-sm text-gray-500 mb-4">Try adjusting your search criteria or check back later.</p>
                  <button 
                    onClick={() => actions.setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnpaidCustomersPage;
