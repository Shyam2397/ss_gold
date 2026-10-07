import { useState, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useQueryClient } from '@tanstack/react-query';
import { Check, AlertCircle, Loader2, Hash, Calendar, Clock, TestTube, IndianRupee, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import tokenService from '../../../services/tokenService';
const ROW_HEIGHT = 36; // Height of each row in pixels

// Define column widths as constants to ensure consistency
const columnWidths = {
  paid: 'w-32',
  token: 'w-48',
  date: 'w-48',
  time: 'w-48',
  test: 'w-64',
  amount: 'w-48',
};

// Move utility functions outside the component
const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount) || 0);
  } catch (e) {
    return '₹0.00';
  }
};

const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const [day, month, year] = dateString.split('/');
    const shortYear = year ? year.slice(-2) : '';
    return `${day}-${month}-${shortYear}`;
  } catch (e) {
    return dateString;
  }
};

// Memoize the customers array to prevent unnecessary re-renders
const memoizedCustomers = (customers) => {
  return useMemo(() => customers, [JSON.stringify(customers)]);
};

const CustomerInvoiceTable = ({ customers: propCustomers = [], groupCode, onPaymentStatusUpdate, onGroupCleared, isLoading }) => {
  const queryClient = useQueryClient();
  const [updatingIds, setUpdatingIds] = useState(new Set());
  // In-flight ids also live in a ref: it backs the double-click guard and the
  // "has everything settled?" check without making the handler depend on state
  // that changes twice per toggle.
  const pendingRef = useRef(new Set());
  // Use memoized customers
  const customers = memoizedCustomers(propCustomers);

  // Memoize the payment status change handler
  const handlePaymentStatusChange = useCallback(async (tokenId, isPaid) => {
    if (pendingRef.current.has(tokenId)) return;
    pendingRef.current.add(tokenId);
    setUpdatingIds(prev => new Set(prev).add(tokenId));

    // Patch the list before the request so the box flips on the click, and
    // stop an in-flight refetch from landing the old value back on screen.
    // Previously the checkbox was hidden behind a spinner until the PATCH
    // resolved, then a full list refetch (GET /tokens + GET /entries) had to
    // finish before it showed anything - two round-trips of dead time.
    await queryClient.cancelQueries({ queryKey: ['unpaid-customers'] });
    await queryClient.cancelQueries({ queryKey: ['tokens'] });
    const previousCustomers = queryClient.getQueryData(['unpaid-customers']);
    const previousTokens = queryClient.getQueryData(['tokens']);
    queryClient.setQueryData(['unpaid-customers'], (oldCustomers) =>
      oldCustomers?.map(customer =>
        customer.id === tokenId ? { ...customer, isPaid } : customer
      )
    );
    // The Token page renders from ['tokens'], whose 5-minute staleTime would
    // otherwise keep showing the old value after navigating back to it.
    // Returning undefined when the cache is cold is a no-op - writing [] would
    // hand the Token page fresh "empty" data for the next 5 minutes.
    queryClient.setQueryData(['tokens'], (oldTokens) =>
      oldTokens?.map(token =>
        token.id === tokenId ? { ...token, isPaid: Boolean(isPaid) } : token
      )
    );

    const code = groupCode ?? previousCustomers?.find((c) => c.id === tokenId)?.code;
    let groupCleared = false;
    try {
      await tokenService.updatePaymentStatus(tokenId, isPaid);
      if (isPaid) {
        // A paid row has no place in the unpaid list: drop it right here
        // rather than waiting for the refetch (two full-table GETs) to remove
        // it. Unchecking cannot reach a removal - the box is only ever
        // rendered unchecked, and re-clicks are blocked while in flight.
        queryClient.setQueryData(['unpaid-customers'], (oldCustomers) =>
          oldCustomers?.filter((customer) => customer.id !== tokenId)
        );
      }
      // Nothing under this code is unpaid any more - rows still in flight
      // count as paid (their own failure would roll the snapshot back and
      // cancel the vanishing group at render time).
      const remaining = queryClient.getQueryData(['unpaid-customers']) ?? [];
      groupCleared = Boolean(
        isPaid && code && !remaining.some((c) => c.code === code && !c.isPaid)
      );
      toast.success('Payment status updated successfully');
    } catch (error) {
      queryClient.setQueryData(['unpaid-customers'], previousCustomers);
      queryClient.setQueryData(['tokens'], previousTokens);
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      pendingRef.current.delete(tokenId);
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenId);
        return newSet;
      });
      // One authority refetch once the last in-flight update settles, not one
      // per click - the rows are already gone from the cache above.
      if (pendingRef.current.size === 0) {
        onPaymentStatusUpdate?.();
      }
      if (groupCleared) {
        onGroupCleared?.(code);
      }
    }
  }, [groupCode, onGroupCleared, onPaymentStatusUpdate, queryClient]);

  // Create a memoized row renderer
  const Row = useMemo(() => {
    return function Row({ index, style }) {
      const customer = customers[index];
      if (!customer) return null;

      const isUpdating = updatingIds.has(customer.id);
      const isPaid = customer.isPaid || false;

      return (
        <div 
          style={style}
          className="flex items-center py-3 px-4 bg-white border-b border-gray-100 hover:bg-amber-200 transition-colors duration-150"
        >
          {/* Paid Checkbox */}
          <div className={`flex items-center justify-center ${columnWidths.paid} px-2`}>
            <div className="relative flex items-center">
              {/* The box stays visible while the request is in flight - the
                  value is already optimistic, so hiding it behind a spinner
                  only made the update look slower. */}
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => handlePaymentStatusChange(customer.id, e.target.checked)}
                className={`h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500${isUpdating ? ' opacity-60 cursor-wait' : ''}`}
                disabled={isUpdating}
              />
              {isPaid && (
                <Check className="h-3 w-3 text-white absolute left-0.5 top-0.5 pointer-events-none" />
              )}
            </div>
          </div>
          
          {/* Token */}
          <div className={`${columnWidths.token} px-3`}>
            <span className="text-sm font-medium text-gray-900 truncate block">
              {customer.tokenNo ? `#${customer.tokenNo}` : 'N/A'}
            </span>
          </div>
          
          {/* Date */}
          <div className={`${columnWidths.date} px-3`}>
            <span className="text-sm text-gray-600 block">
              {formatDate(customer.date) || 'N/A'}
            </span>
          </div>
          
          {/* Time */}
          <div className={`${columnWidths.time} px-3`}>
            <span className="text-sm text-gray-600 block">
              {customer.time && customer.time !== 'N/A' ? customer.time : 'N/A'}
            </span>
          </div>
          
          {/* Test Name */}
          <div className={`${columnWidths.test} px-3`}>
            <span className="text-sm text-gray-600 truncate block">
              {customer.test || 'N/A'}
            </span>
          </div>
          
          {/* Amount */}
          <div className={`${columnWidths.amount} pr-2`}>
            <span className="text-sm font-semibold text-gray-900 text-right block">
              {formatCurrency(customer.outstandingBalance || 0)}
            </span>
          </div>
        </div>
      );
    };
  }, [customers, updatingIds, handlePaymentStatusChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <span className="ml-2 text-sm text-gray-600">Loading tokens...</span>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">No unpaid tokens found</p>
          <button
            onClick={() => onPaymentStatusUpdate?.()}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const listHeight = Math.min(
    400, // max height
    Math.max(
      ROW_HEIGHT * 3, // min height for 3 rows
      Math.min(ROW_HEIGHT * customers.length, 400) // dynamic height based on items
    )
  );

  // Using the columnWidths constant defined at the top

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <div className="px-6 py-4">
        {/* Table Header */}
        <div className="flex items-center py-2 px-4 bg-gradient-to-r from-[#D3B04D] to-[#DD845A] rounded-lg mb-3 border border-[#D3B04D]/20 shadow-sm">
          {/* Paid Column */}
          <div className={`flex items-center justify-center ${columnWidths.paid} px-2`}>
            <span className="text-xs font-semibold text-white uppercase tracking-wide">Paid</span>
          </div>
          
          {/* Token Column */}
          <div className={`flex items-center ${columnWidths.token} px-3`}>
            <Hash className="h-3.5 w-3.5 text-white mr-1.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide truncate">Token</span>
          </div>
          
          {/* Date Column */}
          <div className={`flex items-center ${columnWidths.date} px-3`}>
            <Calendar className="h-3.5 w-3.5 text-white mr-1.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide truncate">Date</span>
          </div>
          
          {/* Time Column */}
          <div className={`flex items-center ${columnWidths.time} px-3`}>
            <Clock className="h-3.5 w-3.5 text-white mr-1.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide truncate">Time</span>
          </div>
          
          {/* Test Name Column */}
          <div className={`flex items-center ${columnWidths.test} px-3`}>
            <TestTube className="h-3.5 w-3.5 text-white mr-1.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide truncate">Test Name</span>
          </div>
          
          {/* Amount Column */}
          <div className={`flex items-center justify-end ${columnWidths.amount} pr-2`}>
            <IndianRupee className="h-3.5 w-3.5 text-white mr-1.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide">Amount</span>
          </div>
        </div>

        {/* Virtualized List */}
        <div className="rounded-lg overflow-hidden border border-gray-100 bg-white">
          <div style={{ height: listHeight }}>
            <List
              height={listHeight}
              itemCount={customers.length}
              itemSize={ROW_HEIGHT}
              width="100%"
              overscanCount={5}
            >
              {Row}
            </List>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInvoiceTable;
