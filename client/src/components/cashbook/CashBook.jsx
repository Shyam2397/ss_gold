import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowUpDown, FileSpreadsheet, Printer, Mail } from 'lucide-react';
import { debounce } from 'lodash';
import apiService from '../../services/api';
import cashAdjustmentService from '../../services/cashAdjustmentService';
import TransactionTable from './components/TransactionTable';
import AnalyticsPanel from './components/AnalyticsPanel';
import CashAdjustment from './CashAdjustment';
import BalanceSummary from './components/BalanceSummary';

// Add new utility function outside component
const calculateBalance = (transactions, openingBalance = 0) => {
  return transactions.reduce((total, t) => {
    // Ensure we're using the same logic everywhere for balance calculation
    if (t.type === 'Income') return total + parseFloat(t.credit || 0);
    if (t.type === 'Expense') return total - parseFloat(t.debit || 0);
    return total;
  }, parseFloat(openingBalance));
};

const CashBook = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [cashInfo, setCashInfo] = useState({
    openingBalance: 0,
    openingPending: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0,
    netChange: 0,
    closingBalance: 0
  });
  const [activeTab, setActiveTab] = useState('categorywise');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [categorySummary, setCategorySummary] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);



  // Fix rowGetter implementation
  const rowGetter = useCallback(({ index }) => {
    if (index === 0) return { type: 'opening' };
    if (index === filteredTransactions.length + 1) return { type: 'closing' };
    return filteredTransactions[index - 1];
  }, [filteredTransactions]);

  // Replace existing fetchTransactions with optimized version
  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError('');
    try {// Get current month dates

// Get current month dates
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();// Calculate first and last day of current month

      
// Calculate first and last day of current month
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const firstDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfPreviousMonth = new Date(currentYear, currentMonth, 0);
      
      const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
      const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];
      const firstDayOfAllTime = new Date(2000, 0, 1).toISOString().split('T')[0];
      const lastDayOfPreviousMonthFormatted = lastDayOfPreviousMonth.toISOString().split('T')[0];
      
      const api = await apiService.getApi();
      const [previousTokensResponse, previousExpensesResponse] = await Promise.all([
        api.get('/tokens', {
          params: {
            from_date: firstDayOfAllTime,
            to_date: lastDayOfPreviousMonth
          },
          headers: {
            'Cache-Control': 'max-age=300'
          }
        }),
        api.get('/api/expenses', {
          params: {
            from_date: firstDayOfAllTime,
            to_date: lastDayOfPreviousMonth
          }
        })
      ]);
      
      const previousIncome = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return token.isPaid ? sum + parseFloat(token.amount || 0) : sum;
        }
        return sum;
      }, 0);
      
      const previousPending = previousTokensResponse.data.reduce((sum, token) => {
        const transactionDate = new Date(token.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return !token.isPaid ? sum + parseFloat(token.amount || 0) : sum;
        }
        return sum;
      }, 0);
      
      const previousExpenses = previousExpensesResponse.data.reduce((sum, expense) => {
        const transactionDate = new Date(expense.date);
        if (transactionDate <= lastDayOfPreviousMonth) {
          return sum + parseFloat(expense.amount || 0);
        }
        return sum;
      }, 0);
      
      const openingBalance = previousIncome - previousExpenses;
      const openingPending = previousPending;
      
      setCashInfo(prev => ({ 
        ...prev, 
        openingBalance,
        openingPending
      }));
      
      const [tokensResponse, expensesResponse] = await Promise.all([
        api.get('/tokens', {
          params: {
            from_date: firstDayFormatted,
            to_date: lastDayFormatted
          }
        }),
        api.get('/api/expenses', {
          params: {
            from_date: firstDayFormatted,
            to_date: lastDayFormatted
          }
        })
      ]);
      
      // Get adjustments using the service
      const adjustments = await cashAdjustmentService.getAdjustments({
        from_date: firstDayFormatted,
        to_date: lastDayFormatted
      });

      // Process token transactions with detailed logging
      const tokenTransactions = [];
      let totalTokenIncome = 0;
      let totalTokenPending = 0;
      
      tokensResponse.data.forEach(token => {
        const amount = parseFloat(token.amount) || 0;
        const isPaid = Boolean(token.isPaid);
        // Change: Set type based on payment status
        const type = isPaid ? 'Income' : 'Pending';
        
        const transaction = {
          id: `token-${token.id}`,
          date: token.date,
          particulars: {
            test: token.test || 'No Test',
            tokenNo: token.tokenNo,
            name: token.name
          },
          type,
          isPaid,
          amount,
          source: 'token',
          // Change: Set credit/debit based on payment status
          credit: isPaid ? amount : 0,
          debit: !isPaid ? amount : 0,
          paymentStatus: isPaid ? 'Paid' : 'Pending'
        };
        
        tokenTransactions.push(transaction);
      }); // Added missing closing bracket and semicolon here
      
      console.log('Token Transaction Summary:', {
        totalTokens: tokensResponse.data.length,
        totalTokenIncome,
        totalTokenPending,
        calculatedTotal: totalTokenIncome + totalTokenPending
      });

      const expenseTransactions = expensesResponse.data.map(expense => ({
        id: `expense-${expense.id}`,
        date: expense.date,
        particulars: `${expense.expense_type} - ${expense.paid_to || 'N/A'}`,
        type: 'Expense',
        debit: parseFloat(expense.amount) || 0,
        credit: 0
      }));

      // Convert cash adjustments to transactions
      const adjustmentTransactions = adjustments.map(adj => ({
        id: `adjustment-${adj.id}`,
        date: adj.date,
        time: adj.time,
        particulars: `Cash Adjustment: ${adj.reason}${adj.reference_number ? ` (Ref: ${adj.reference_number})` : ''}`,
        type: adj.adjustment_type === 'addition' ? 'Income' : 'Expense',
        debit: adj.adjustment_type === 'deduction' ? parseFloat(adj.amount) || 0 : 0,
        credit: adj.adjustment_type === 'addition' ? parseFloat(adj.amount) || 0 : 0,
        isAdjustment: true,
        remarks: adj.remarks
      }));

      const allTransactions = [...tokenTransactions, ...expenseTransactions, ...adjustmentTransactions]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      });

      const currentMonthTransactionsWithBalance = currentMonthTransactions.map((transaction) => {
        return {
          ...transaction,
          pendingBalance: transaction.type === 'Pending' ? transaction.debit : 0
        };
      });

      const previousTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < firstDayOfMonth;
      });

      const transactionsWithBalance = [...previousTransactions, ...currentMonthTransactionsWithBalance];

      setTransactions(transactionsWithBalance);
    } catch (err) {
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  const debouncedFetch = useMemo(
    () => debounce((isRefresh) => fetchTransactions(isRefresh), 1000),
    [fetchTransactions]
  );

  useEffect(() => {
    fetchTransactions();
    const pollInterval = setInterval(() => {
      debouncedFetch(true);
    }, 30000);
    return () => {
      clearInterval(pollInterval);
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  const memoizedFilteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const currentMonthTransactions = transactions
      .filter(transaction => {
        if (!transaction?.date) return false;
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
      })
      .sort((a, b) => {
        if (!a?.date || !b?.date) return 0;
        
        // Convert dates to ISO string for consistent timezone handling
        const dateA = new Date(a.date).toISOString().split('T')[0];
        const dateB = new Date(b.date).toISOString().split('T')[0];
        
        if (dateA !== dateB) {
          return new Date(dateA) - new Date(dateB);
        }
        
        // If same date, compare times if available
        const timeA = a.time || '00:00:00';
        const timeB = b.time || '00:00:00';
        
        if (timeA !== timeB) {
          return new Date(`${dateA}T${timeA}`) - new Date(`${dateB}T${timeB}`);
        }
        
        // If same time, sort by transaction type
        const typeOrder = { 'Income': 1, 'Expense': 2, 'Pending': 3 };
        if (a.type !== b.type) {
          return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
        }
        
        // If same type, sort by ID
        const idA = parseInt((a.id || '').replace(/\D/g, '') || '0');
        const idB = parseInt((b.id || '').replace(/\D/g, '') || '0');
        return idA - idB;
      });

    // Calculate running balance
    let runningBalance = cashInfo.openingBalance || 0;
    return currentMonthTransactions.map(transaction => ({
      ...transaction,
      runningBalance: calculateBalance([transaction], runningBalance)
    }));
  }, [transactions, cashInfo.openingBalance]);

  useEffect(() => {
    setFilteredTransactions(memoizedFilteredTransactions);
  }, [memoizedFilteredTransactions]);

  useEffect(() => {
    if (!memoizedFilteredTransactions.length) return;

    // Calculate totals from current month transactions with detailed breakdown
    const totals = {
      totalIncome: 0,
      totalExpense: 0,
      totalPending: 0,
      incomeSources: [],
      tokenIncome: 0,
      adjustmentIncome: 0,
      paidPendingIncome: 0
    };

    console.log('Processing', memoizedFilteredTransactions.length, 'transactions...');
    
    // First pass: process all tokens to identify paid pending transactions
    const pendingToIncomeMap = new Map();
    
    memoizedFilteredTransactions.forEach((transaction) => {
      // Map all pending transactions for reference
      if (transaction.type === 'Pending') {
        const amount = parseFloat(transaction.amount || 0);
        if (transaction.isPaid) {
          pendingToIncomeMap.set(transaction.id, {
            amount,
            isPaid: true,
            source: transaction.source || 'token'
          });
        }
      }
    });
    
    // Second pass: process all transactions
    memoizedFilteredTransactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount || 0);
      const isPaid = transaction.isPaid;
      const type = transaction.type;
      const source = transaction.source || 'token'; // Default to 'token' for backward compatibility
      
      // Log transaction details for debugging
      const logEntry = {
        id: transaction.id,
        type,
        isPaid,
        source,
        amount,
        credit: transaction.credit,
        debit: transaction.debit
      };
      
      // Process based on transaction type and payment status
      if (type === 'Income' || type === 'Pending') {
        const amount = parseFloat(transaction.amount || 0);
        const isPending = type === 'Pending';
        
        if (amount > 0) {
          if (isPending && !isPaid) {
            // For pending/unpaid: show in debit column and track as pending
            transaction.debit = amount;
            transaction.credit = 0;
            totals.totalPending += amount;
            
            // Add to income sources as pending
            totals.incomeSources.push({
              type: 'Pending',
              source: source || 'token',
              amount: amount,
              id: transaction.id,
              isPaid: false
            });
            
            logEntry.processedAs = 'Pending (Unpaid)';
            logEntry.addedToIncome = amount;
          } else {
            // For paid transactions: show in credit column and add to income
            transaction.credit = amount;
            transaction.debit = 0;
            totals.totalIncome += amount;
            
            // Track token income
            if (source === 'token') {
              totals.tokenIncome += amount;
            } else if (source === 'adjustment') {
              totals.adjustmentIncome += amount;
            }
            
            // Add to income sources as paid
            totals.incomeSources.push({
              type: isPending ? 'Paid Pending' : 'Income',
              source: source || 'token',
              amount: amount,
              id: transaction.id,
              isPaid: true
            });
            
            logEntry.processedAs = isPending ? 'Pending (Paid)' : 'Income';
            logEntry.addedToIncome = amount;
          }
        }
        
      } else if (type === 'Expense') {
        const expenseAmount = parseFloat(transaction.debit || 0);
        if (expenseAmount > 0) {
          totals.totalExpense += expenseAmount;
          logEntry.processedAs = 'Expense';
          logEntry.addedToExpense = expenseAmount;
        }
      }
      
      console.log('Processed Transaction:', logEntry);
    });

    // Log detailed summary
    console.log('\n=== Transaction Processing Summary ===');
    console.log('Total Transactions Processed:', memoizedFilteredTransactions.length);
    console.log('\nIncome Breakdown:');
    console.log('- Token Income:', totals.tokenIncome);
    console.log('- Adjustment Income:', totals.adjustmentIncome);
    console.log('- Paid Pending Income:', totals.paidPendingIncome);
    console.log('\nCalculated Totals:');
    console.log('- Total Income:', totals.totalIncome);
    console.log('- Total Expense:', totals.totalExpense);
    console.log('- Total Pending:', totals.totalPending);
    console.log('==================================\n');
    
    // Verify the sum of income sources matches total income
    const calculatedTotalIncome = totals.incomeSources.reduce((sum, src) => sum + src.amount, 0);
    if (Math.abs(calculatedTotalIncome - totals.totalIncome) > 0.01) {
      console.warn('Warning: Income sources sum does not match total income!', {
        calculatedTotalIncome,
        totalIncome: totals.totalIncome,
        difference: Math.abs(calculatedTotalIncome - totals.totalIncome)
      });
    }

    // Calculate balances
    const netChange = totals.totalIncome - totals.totalExpense;
    const openingBalance = parseFloat(cashInfo.openingBalance || 0);
    const closingBalance = openingBalance + netChange;
    const totalPending = parseFloat(cashInfo.openingPending || 0) + parseFloat(totals.totalPending || 0);

    setCashInfo(prev => ({
      ...prev,
      ...totals,
      netChange,
      closingBalance,
      totalPending
    }));
  }, [memoizedFilteredTransactions, cashInfo.openingBalance, cashInfo.openingPending]);

  const memoizedAnalytics = useMemo(() => {
    // Consider all transactions, not just filtered ones
    if (!transactions.length) return { categories: [], monthly: [] };
    
    const expenseMap = new Map();
    const monthlyMap = new Map();

    transactions.forEach(transaction => {
      if (transaction?.type === 'Expense' && transaction?.particulars) {
        const category = typeof transaction.particulars === 'string' 
          ? transaction.particulars.split(' - ')[0]
          : 'Other';
        expenseMap.set(category, (expenseMap.get(category) || 0) + (transaction.debit || 0));
      }

      if (transaction?.date) {
        const date = new Date(transaction.date);
        const monthKey = date.toLocaleDateString('en-IN', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        const monthData = monthlyMap.get(monthKey) || { 
          month: monthKey,
          timestamp: date.getTime(), // Add timestamp for better sorting
          income: 0, 
          expense: 0, 
          pending: 0,
          total: 0
        };

        if (transaction.type === 'Income') {
          monthData.income += transaction.credit || 0;
          monthData.total += transaction.credit || 0;
        } else if (transaction.type === 'Expense') {
          monthData.expense += transaction.debit || 0;
          monthData.total -= transaction.debit || 0;
        } else if (transaction.type === 'Pending') {
          monthData.pending += transaction.debit || 0;
        }

        monthlyMap.set(monthKey, monthData);
      }
    });

    const sortedCategories = Array.from(expenseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const monthlyData = Array.from(monthlyMap.values())
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp instead of parsing date string

    return { categories: sortedCategories, monthly: monthlyData };
  }, [transactions]); // Change dependency from memoizedFilteredTransactions to transactions

  useEffect(() => {
    setCategorySummary(memoizedAnalytics.categories);
    setMonthlySummary(memoizedAnalytics.monthly);
  }, [memoizedAnalytics]);

  const handleExport = useCallback((type) => {
    switch(type) {
      case 'excel':
      case 'print':
        window.print();
        break;
      case 'email':
        break;
      default:
        break;
    }
  }, []);

  const handleAdjustmentSave = useCallback(async () => {
    // The actual save is handled in the CashAdjustment component
    // This just triggers a refresh of the transactions
    setLoading(true);
    try {
      await fetchTransactions();
      setShowAdjustment(false);
    } catch (err) {
      setError('Failed to refresh transactions after adjustment');
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[100vh] bg-white mx-2 sm:mx-4 my-4 p-2 sm:p-3 shadow-md rounded-xl border border-amber-100 border-solid">
      <div className="px-3 sm:px-4 md:px-6 py-2 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 bg-white shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-amber-800 tracking-tight">Cash Book</h1>
          <span className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-50 text-amber-700 rounded-full font-medium ring-1 ring-amber-100/50">Report</span>
        </div>
        {isRefreshing && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-600">
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-amber-500 border-t-transparent"></div>
            <span>Updating...</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-1 sm:p-2">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <p className="text-sm text-amber-600">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="text-red-500 text-center">
                <p className="text-lg font-medium">Error loading transactions</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={() => fetchTransactions()}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="text-gray-500 text-center">
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm mt-1">There are no transactions recorded for this period.</p>
              </div>
            </div>
          ) : (
            <div className="py-1 md:py-2 px-0 sm:px-1 flex flex-col lg:flex-row gap-2 sm:gap-3">
              {/* Main Transactions Panel */}
              <div className="flex-1 order-2 lg:order-1 min-w-0">
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-amber-50 px-3 sm:px-4 py-1.5 border-b">
                    <h3 className="font-medium text-sm sm:text-base text-amber-800">
                      {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Transactions
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <TransactionTable
                      filteredTransactions={filteredTransactions}
                      cashInfo={cashInfo}
                      rowGetter={rowGetter}
                      totals={cashInfo} // Pass cashInfo as totals since it contains the required properties
                    />
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="w-full lg:w-72 space-y-3 order-1 lg:order-2">
                <button 
                  onClick={() => setShowAdjustment(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-colors"
                >
                  <ArrowUpDown size={14} className="flex-shrink-0" />
                  <span>Cash Adjustments</span>
                </button>
                
                <BalanceSummary cashInfo={cashInfo} />
                
                <div className="sticky top-4">
                  <AnalyticsPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    categorySummary={categorySummary}
                    monthlySummary={monthlySummary}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-2 sm:px-3 py-1.5 flex flex-row xs:flex-row justify-between items-center gap-1.5 bg-white sticky bottom-0 shadow-sm mt-auto">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <button onClick={() => handleExport('excel')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-xs sm:text-sm font-medium transition-colors px-2 py-1 hover:bg-amber-50 rounded-md">
              <FileSpreadsheet size={14} className="flex-shrink-0" />
              <span className="whitespace-nowrap">Excel</span>
            </button>
            <button onClick={() => handleExport('print')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-xs sm:text-sm font-medium transition-colors px-2 py-1 hover:bg-amber-50 rounded-md">
              <Printer size={14} className="flex-shrink-0" />
              <span className="whitespace-nowrap">Print</span>
            </button>
            <button onClick={() => handleExport('email')} 
              className="flex items-center gap-1.5 text-gray-600 hover:text-amber-600 text-xs sm:text-sm font-medium transition-colors px-2 py-1 hover:bg-amber-50 rounded-md">
              <Mail size={14} className="flex-shrink-0" />
              <span className="whitespace-nowrap">Email</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] xs:text-xs text-gray-500">
            <span className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded-full whitespace-nowrap">Limited Version</span>
          </div>
        </div>
      <CashAdjustment 
        isOpen={showAdjustment}
        onClose={() => setShowAdjustment(false)}
        onSave={handleAdjustmentSave}
        isLoading={loading}
      />
    </div>
  );
}

// Add memo to component export
export default React.memo(CashBook);