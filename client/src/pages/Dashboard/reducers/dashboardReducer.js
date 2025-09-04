export const initialState = {
  tokens: [],
  entries: [],
  expenses: [],
  exchanges: [],
  cashAdjustments: [],
  loading: true,
  error: null,
  recentActivities: [],
  todayTotal: {
    revenue: 0,
    expenses: 0,
    netTotal: 0,
    formattedRevenue: '₹0.00',
    formattedExpenses: '₹0.00',
    formattedNetTotal: '₹0.00'
  },
  dateRange: {
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  },
  metrics: {
    totalCustomers: 0,
    skinTestCount: 0,
    photoTestCount: 0,
    totalTokens: 0,
    totalExchanges: 0,
    totalWeight: 0,
    totalExWeight: 0,
    totalCashAdjustments: 0
  },
  selectedPeriod: 'daily',
  currentPage: 1,
  hasNextPage: false,
  isFetchingNextPage: false
};

export const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DATA: 'SET_DATA',
  UPDATE_METRICS: 'UPDATE_METRICS',
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  SET_PERIOD: 'SET_PERIOD',
  SET_PAGE: 'SET_PAGE',
  UPDATE_TODAY_TOTAL: 'UPDATE_TODAY_TOTAL',
  UPDATE_RECENT_ACTIVITIES: 'UPDATE_RECENT_ACTIVITIES',
  SET_DATA_WITH_METRICS: 'SET_DATA_WITH_METRICS'
};

// Add helper functions for data processing
const calculateTodayTotal = (tokens, expenses) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTokens = tokens.filter(token => token.date === today);
  const todayExpenses = expenses.filter(expense => expense.date === today);
  
  const revenue = todayTokens.reduce((sum, token) => sum + (parseFloat(token.amount) || 0), 0);
  const expensesTotal = todayExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const netTotal = revenue - expensesTotal;

  return {
    revenue,
    expenses: expensesTotal,
    netTotal,
    formattedRevenue: `₹${revenue.toFixed(2)}`,
    formattedExpenses: `₹${expensesTotal.toFixed(2)}`,
    formattedNetTotal: `₹${netTotal.toFixed(2)}`
  };
};

export function dashboardReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case actionTypes.SET_DATA:
      return {
        ...state,
        ...action.payload,
        loading: false
      };
      
    case actionTypes.UPDATE_METRICS:
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload }
      };
      
    case actionTypes.SET_DATE_RANGE:
      return {
        ...state,
        dateRange: action.payload
      };
      
    case actionTypes.SET_PERIOD:
      return {
        ...state,
        selectedPeriod: action.payload
      };
      
    case actionTypes.SET_PAGE:
      return {
        ...state,
        currentPage: action.payload
      };

    case actionTypes.SET_DATA_WITH_METRICS:
      const { tokens, expenses, entries, exchanges, cashAdjustments = [] } = action.payload;
      const todayTotal = calculateTodayTotal(tokens, expenses);
      const metrics = {
        totalCustomers: entries.length,
        skinTestCount: tokens.filter(t => t.test === "Skin Test").length,
        photoTestCount: tokens.filter(t => t.test === "Photo Testing").length,
        totalTokens: tokens.length,
        totalExchanges: exchanges.length,
        totalWeight: exchanges.reduce((sum, ex) => sum + (parseFloat(ex.weight) || 0), 0),
        totalExWeight: exchanges.reduce((sum, ex) => sum + (parseFloat(ex.exweight) || 0), 0),
        totalCashAdjustments: cashAdjustments.reduce((sum, adj) => sum + (parseFloat(adj.amount) || 0), 0)
      };

      return {
        ...state,
        tokens,
        expenses,
        entries,
        exchanges,
        todayTotal,
        metrics,
        loading: false
      };

    default:
      return state;
  }
}
