import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getApi } from '../../../services/api';
import { fetchCashAdjustments } from '../services/dashboardService';
import toast from 'react-hot-toast';
import { parseDate } from '../utils/dateUtils';

// How often the dashboard silently refreshes its data (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

// Start/end of the current day, week, month or year.
function getPeriodRange(period) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  let start;
  switch (period) {
    case 'yearly':
      start = new Date(end.getFullYear(), 0, 1);
      break;
    case 'monthly':
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      break;
    case 'weekly':
      start = new Date(end);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - start.getDay());
      break;
    default:
      start = new Date(end);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function isWithinRange(dateStr, range) {
  if (!dateStr) return false;
  const date = parseDate(dateStr);
  if (isNaN(date.getTime())) return false;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return day >= range.start && day <= range.end;
}

function useDashboardData() {
  const [tokens, setTokens] = useState([]);
  const [entries, setEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [cashAdjustments, setCashAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayTotal, setTodayTotal] = useState({
    revenue: 0, expenses: 0, netTotal: 0,
    formattedRevenue: '₹0.00', formattedExpenses: '₹0.00', formattedNetTotal: '₹0.00'
  });
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  // Holds the AbortController for the currently active fetch cycle. Created and
  // disposed inside the loading effect so it survives React StrictMode's
  // mount -> cleanup -> remount in development.
  const abortControllerRef = useRef(null);

  // Overall (all-time) totals for every card, except Pure Exchange whose
  // weights follow the currently selected period.
  const metrics = useMemo(() => {
    const revenue = tokens.reduce((sum, token) => sum + (token.totalAmount || 0), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const adjustments = (cashAdjustments || []).reduce((acc, adjustment) => {
      const amount = parseFloat(adjustment?.amount) || 0;
      if (adjustment?.adjustment_type?.toLowerCase() === 'addition') {
        acc.credit += amount;
      } else {
        acc.debit += amount;
      }
      return acc;
    }, { credit: 0, debit: 0 });

    const totalRevenue = revenue + adjustments.credit;
    const totalExpenses = expenseTotal + adjustments.debit;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const range = getPeriodRange(selectedPeriod);
    const periodExchanges = exchanges.filter(exchange => isWithinRange(exchange.date, range));

    return {
      totalCustomers: entries.length,
      totalTokens: tokens.length,
      skinTestCount: tokens.filter(token => token.test === 'Skin Testing').length,
      photoTestCount: tokens.filter(token => token.test === 'Photo Testing').length,
      totalExchanges: exchanges.length,
      totalWeight: periodExchanges.reduce((sum, exchange) => sum + (exchange.weight || 0), 0),
      totalExWeight: periodExchanges.reduce((sum, exchange) => sum + (exchange.exweight || 0), 0),
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin
    };
  }, [tokens, expenses, entries, exchanges, cashAdjustments, selectedPeriod]);

  const processRecentActivities = (tokenList, expenseList, exchangeList, entryList, adjustmentList, categories) => {
    const expenseCategoryMap = new Map(categories.map(cat => [cat.id, cat.expense_name]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getUniqueId = (prefix, id) => {
      const uniqueCounter = Math.floor(Math.random() * 1000);
      return `${prefix}-${id || uniqueCounter}-${Date.now()}-${uniqueCounter}`;
    };

    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) return false;
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    const activities = [
      ...tokenList
        .filter(token => token.date && isToday(token.date))
        .map(token => {
          const time = parseDate(token.date, token.time);
          return {
            id: `token-${token._id || token.token_no || getUniqueId('token', null)}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'token',
            action: `${token.test || 'Token'} - ${token.name || 'Unknown'}`,
            amount: parseFloat(token.amount || 0),
            time,
            details: `Weight: ${parseFloat(token.weight || 0).toFixed(3)}g`,
            _sortTime: time.getTime()
          };
        }),
      ...expenseList
        .filter(expense => expense.date && isToday(expense.date))
        .map(expense => {
          const time = parseDate(expense.created_at || expense.date);
          return {
            id: getUniqueId('expense', expense._id),
            type: 'expense',
            action: expense.description || 'Expense added',
            amount: -parseFloat(expense.amount || 0),
            time,
            details: `Category: ${expenseCategoryMap.get(parseInt(expense.expense_type, 10)) || 'Uncategorized'}`,
            _sortTime: time.getTime()
          };
        }),
      ...exchangeList
        .filter(exchange => exchange.date && isToday(exchange.date))
        .map(exchange => {
          const time = parseDate(exchange.date, exchange.time);
          return {
            id: getUniqueId('exchange', exchange._id),
            type: 'exchange',
            action: 'Exchange recorded',
            amount: 0,
            time,
            details: `Impure: ${parseFloat(exchange.weight || 0).toFixed(3)}g → Pure: ${parseFloat(exchange.exweight || 0).toFixed(3)}g`,
            _sortTime: time.getTime()
          };
        }),
      ...entryList
        .filter(entry => entry.created_at && isToday(entry.created_at))
        .map(entry => {
          const time = parseDate(entry.created_at);
          return {
            id: getUniqueId('entry', entry._id),
            type: 'entry',
            action: 'New customer registered',
            amount: 0,
            time,
            details: entry.name || 'Unknown customer',
            _sortTime: time.getTime()
          };
        }),
      ...(Array.isArray(adjustmentList) ? adjustmentList : [])
        .filter(adjustment => adjustment && adjustment.date && isToday(adjustment.date))
        .map(adjustment => {
          const amount = parseFloat(adjustment?.amount || 0);
          const isCredit = adjustment?.adjustment_type?.toLowerCase() === 'addition';
          const action = isCredit ? 'Cash Added' : 'Cash Deducted';
          const time = parseDate(adjustment.date, adjustment.time);

          return {
            id: getUniqueId('adjustment', adjustment?._id),
            type: 'adjustment',
            action,
            amount: isCredit ? amount : -amount,
            time,
            details: `Reason: ${adjustment?.reason || 'No reason provided'}`,
            reference: adjustment?.reference_number ? `Ref: ${adjustment.reference_number}` : '',
            remarks: adjustment?.remarks,
            isCredit,
            _sortTime: time.getTime()
          };
        })
    ];

    // Filter out invalid dates and sort by timestamp (most recent first)
    const validActivities = activities.filter(activity =>
      activity.time instanceof Date && !isNaN(activity.time.getTime())
    );
    const sortedActivities = [...validActivities].sort((a, b) => b._sortTime - a._sortTime);

    // Format the display time and drop internal fields
    return sortedActivities.map(activity => {
      const displayTime = activity.time.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const { _sortTime, ...rest } = activity;
      return {
        ...rest,
        time: displayTime
      };
    });
  };

  const fetchDashboardData = useCallback(async () => {
    const signal = abortControllerRef.current?.signal;
    try {
      setError(null);

      const instance = await getApi();
      const request = (url) => instance.get(url, signal ? { signal } : undefined);

      const [
        tokensResult,
        expensesResult,
        entriesResult,
        exchangesResult,
        expenseCategoriesResult
      ] = await Promise.all([
        request('/tokens'),
        request('/api/expenses'),
        request('/entries'),
        request('/pure-exchange'),
        request('/api/expense-master')
      ]);

      const cashAdjustmentsData = await fetchCashAdjustments();

      const tokenData = tokensResult?.data || [];
      const entriesData = entriesResult?.data || [];
      const rawExpenses = expensesResult?.data || [];
      const exchangesData = exchangesResult?.data?.data || [];
      const expenseCategoriesData = expenseCategoriesResult?.data || [];

      // Normalise exchange dates to DD/MM/YYYY and coerce weights to numbers
      const processedExchanges = exchangesData.map(exchange => {
        try {
          const isoDate = new Date(exchange.date);
          return {
            ...exchange,
            date: `${isoDate.getDate().toString().padStart(2, '0')}/${(isoDate.getMonth() + 1).toString().padStart(2, '0')}/${isoDate.getFullYear()}`,
            weight: parseFloat(exchange.weight || '0'),
            exweight: parseFloat(exchange.exweight || '0')
          };
        } catch (err) {
          return null;
        }
      }).filter(Boolean);

      const processedTokens = tokenData.map(token => ({
        ...token,
        totalAmount: parseFloat(token.amount || '0'),
        weight: parseFloat(token.weight || '0')
      }));

      const processedExpenses = rawExpenses.map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount || '0')
      }));

      setExchanges(processedExchanges);
      setCashAdjustments(cashAdjustmentsData);
      setTokens(processedTokens);
      setEntries(entriesData);
      setExpenses(processedExpenses);

      // Today's totals
      const now = new Date();
      const isSameDay = (dateStr) => {
        if (!dateStr) return false;
        const d = parseDate(dateStr);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      };

      const todayTokens = processedTokens.filter(token => isSameDay(token.date));
      const todayExpenses = processedExpenses.filter(expense => isSameDay(expense.date));
      const todayCashAdjustments = (Array.isArray(cashAdjustmentsData) ? cashAdjustmentsData : [])
        .filter(adjustment => isSameDay(adjustment?.date));

      let todayRevenue = todayTokens.reduce((sum, token) => sum + (token.totalAmount || 0), 0);
      let todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

      todayCashAdjustments.forEach(adjustment => {
        const amount = parseFloat(adjustment.amount) || 0;
        const isCredit = adjustment.adjustment_type?.toLowerCase() === 'addition';
        if (isCredit) {
          todayRevenue += amount;
        } else {
          todayExpensesTotal += amount;
        }
      });

      const todayNetTotal = todayRevenue - todayExpensesTotal;

      setTodayTotal({
        revenue: todayRevenue,
        expenses: todayExpensesTotal,
        netTotal: todayNetTotal,
        formattedRevenue: `₹${todayRevenue.toFixed(2)}`,
        formattedExpenses: `₹${todayExpensesTotal.toFixed(2)}`,
        formattedNetTotal: `₹${todayNetTotal.toFixed(2)}`
      });

      setRecentActivities(processRecentActivities(
        processedTokens,
        rawExpenses,
        processedExchanges,
        entriesData,
        cashAdjustmentsData,
        expenseCategoriesData
      ));

      setLoading(false);
    } catch (err) {
      // Ignore cancellations triggered by unmount
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setError(err.message);
      setLoading(false);
      toast.error('Failed to load dashboard data');
    }
  }, []);

  // Initial load + silent periodic refresh. The controller is recreated on every
  // mount so StrictMode remounts start from a fresh, non-aborted signal.
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchDashboardData]);

  return {
    tokens,
    entries,
    expenses,
    exchanges,
    cashAdjustments,
    loading,
    error,
    recentActivities,
    todayTotal,
    metrics,
    selectedPeriod,
    setSelectedPeriod
  };
}

export { useDashboardData };
