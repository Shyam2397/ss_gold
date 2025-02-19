import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CurrencyRupeeIcon, 
  ScaleIcon, 
  ReceiptPercentIcon, 
  UserGroupIcon, 
  BeakerIcon, 
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Trend Sparkline component
const TrendSparkline = ({ data, color }) => (
  <div className="h-6 w-20">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={1.5} 
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Enhanced DashboardCard component
const DashboardCard = ({ title, value, trend, icon: Icon, description, sparklineData, className, iconClassName, valueClassName }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = trend > 0;
  const trendColor = isPositive ? '#F7DC6F' : '#EF4444';

  return (
    <motion.div
      className={`bg-white rounded-3xl shadow-sm hover:shadow relative overflow-hidden min-h-[120px] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-50" />
      
      {/* Card content */}
      <div className="p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {Icon && (
                <div className="p-1.5 rounded-lg bg-yellow-50 shrink-0">
                  <Icon className={`w-5 h-5 ${iconClassName}`} />
                </div>
              )}
            </motion.div>
            <h3 className="text-gray-600 text-base sm:text-xl font-medium truncate overflow-hidden flex-1">{title}</h3>
          </div>
          
          {/* Trend indicator */}
          <motion.div
            className={`flex items-center px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-yellow-50' : 'bg-red-50'
            } ml-2 shrink-0`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              animate={{ 
                y: isHovered ? [-1, 1, -1] : 0 
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {isPositive ? (
                <ArrowUpIcon className="w-3 h-3 text-yellow-600" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-500" />
              )}
            </motion.div>
            <span className={`ml-1 text-xs ${
              isPositive ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.abs(trend)}%
            </span>
          </motion.div>
        </div>

        {/* Value, description and sparkline */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
            <motion.div
              className={`text-xl sm:text-2xl font-bold ${valueClassName}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {value}
            </motion.div>

            {/* Sparkline */}
            <AnimatePresence>
              {sparklineData && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendSparkline data={sparklineData} color={trendColor} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.p 
            className="text-xs sm:text-sm text-gray-500 truncate max-w-full sm:max-w-[90%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {description}
          </motion.p>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-yellow-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.02 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
};

// Main Dashboard component
function Dashboard() {
  const [tokens, setTokens] = useState([]);
  const [entries, setEntries] = useState([]); 
  const [expenses, setExpenses] = useState([]);
  const [exchanges, setExchanges] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayTotal, setTodayTotal] = useState({
    revenue: 0,
    expenses: 0,
    netTotal: 0,
    formattedRevenue: '₹0.00',
    formattedExpenses: '₹0.00',
    formattedNetTotal: '₹0.00'
  });
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    toDate: new Date().toISOString().split('T')[0] // Today
  });

  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    skinTestCount: 0,
    photoTestCount: 0,
    totalTokens: 0,
    totalExchanges: 0,
    totalWeight: 0,
    totalExWeight: 0
  });
  const [sparklineData, setSparklineData] = useState({
    revenue: [],
    expenses: [],
    profit: [],
    margin: [],
    customers: [],
    skinTests: [],
    photoTests: [],
    weights: []
  });

  // Function to filter exchanges by date range
  const getFilteredExchanges = (exchanges) => {
    return exchanges.filter(exchange => {
      // Convert date strings to Date objects
      const exchangeDate = new Date(exchange.date.split('-').reverse().join('-')); // Convert DD-MM-YYYY to YYYY-MM-DD
      const fromDate = new Date(dateRange.fromDate);
      const toDate = new Date(dateRange.toDate);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date

      return exchangeDate >= fromDate && exchangeDate <= toDate;
    });
  };

  // Update metrics when date range changes
  useEffect(() => {
    if (exchanges.length > 0) {
      const filteredExchanges = getFilteredExchanges(exchanges);
      console.log('Date Range Changed - Filtered Exchanges:', filteredExchanges);
      
      setMetrics(prev => ({
        ...prev,
        totalExchanges: filteredExchanges.length,
        totalWeight: filteredExchanges.reduce((sum, exchange) => 
          sum + parseFloat(exchange.weight || '0'), 0),
        totalExWeight: filteredExchanges.reduce((sum, exchange) => 
          sum + parseFloat(exchange.exWeight || '0'), 0)
      }));
    }
  }, [dateRange, exchanges]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tokensRes, expensesRes, entriesRes, exchangesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/tokens`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/expenses`),
          axios.get(`${import.meta.env.VITE_API_URL}/entries`),
          axios.get(`${import.meta.env.VITE_API_URL}/pure-exchange`)
        ]);

        const tokenData = tokensRes.data;
        const entriesData = entriesRes.data;
        const exchangesData = exchangesRes.data.data || [];

        console.log('Raw Token Data:', tokenData);
        console.log('Raw Entries Data:', entriesData);
        console.log('Raw Exchanges Data:', exchangesData);
        
        // Process tokens and calculate metrics
        const processedTokens = tokenData.map(token => {
          const totalAmount = parseFloat(token.amount || '0');
          const weight = parseFloat(token.weight || '0');
          return { ...token, totalAmount, weight };
        });

        // Store full exchanges data
        setExchanges(exchangesData);

        // Calculate initial metrics
        const filteredExchanges = getFilteredExchanges(exchangesData);
        
        setMetrics({
          totalCustomers: entriesData.length,
          totalTokens: processedTokens.length,
          skinTestCount: processedTokens.filter(token => token.test === 'Skin Testing').length,
          photoTestCount: processedTokens.filter(token => token.test === 'Photo Testing').length,
          totalExchanges: filteredExchanges.length,
          totalWeight: filteredExchanges.reduce((sum, exchange) => 
            sum + parseFloat(exchange.weight || '0'), 0),
          totalExWeight: filteredExchanges.reduce((sum, exchange) => 
            sum + parseFloat(exchange.exWeight || '0'), 0)
        });

        setTokens(processedTokens);
        setEntries(entriesData);
        setExpenses(expensesRes.data);
        
        // Update sparkline data
        const last7Days = Array.from({length: 7}, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toLocaleDateString();
        }).reverse();

        // Helper function to calculate trend
        const calculateTrend = (currentValue, previousValue) => {
          return previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;
        };

        // Calculate current and previous period values for trends
        const currentMonth = new Date().getMonth();
        const currentMonthRevenue = tokens
          .filter(token => new Date(token.date).getMonth() === currentMonth)
          .reduce((sum, token) => sum + (token.totalAmount || 0), 0);
        
        const lastMonthRevenue = tokens
          .filter(token => new Date(token.date).getMonth() === currentMonth - 1)
          .reduce((sum, token) => sum + (token.totalAmount || 0), 0);

        const revenueGrowth = lastMonthRevenue ? 
          ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        // Calculate month-over-month growth for expenses, net profit, and profit margin
        const currentMonthExpenses = expenses
          .filter(expense => new Date(expense.date).getMonth() === currentMonth)
          .reduce((sum, expense) => sum + expense.amount, 0);
        
        const lastMonthExpenses = expenses
          .filter(expense => new Date(expense.date).getMonth() === currentMonth - 1)
          .reduce((sum, expense) => sum + expense.amount, 0);

        const expensesGrowth = lastMonthExpenses ? 
          ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

        const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
        const lastMonthProfit = lastMonthRevenue - lastMonthExpenses;
        const profitGrowth = lastMonthProfit ? 
          ((currentMonthProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0;

        const currentMonthMargin = currentMonthRevenue ? (currentMonthProfit / currentMonthRevenue) * 100 : 0;
        const lastMonthMargin = lastMonthRevenue ? (lastMonthProfit / lastMonthRevenue) * 100 : 0;
        const marginGrowth = lastMonthMargin ? 
          ((currentMonthMargin - lastMonthMargin) / lastMonthMargin) * 100 : 0;

        // Calculate customer trends
        const currentPeriodCustomers = entriesData.filter(entry => 
          new Date(entry.createdAt).getMonth() === currentMonth).length;
        
        const previousPeriodCustomers = entriesData.filter(entry => 
          new Date(entry.createdAt).getMonth() === currentMonth - 1).length;

        const customersTrend = calculateTrend(currentPeriodCustomers, previousPeriodCustomers);

        // Calculate token trends
        const currentPeriodTokens = processedTokens.filter(token => 
          new Date(token.date).getMonth() === currentMonth).length;
        
        const previousPeriodTokens = processedTokens.filter(token => 
          new Date(token.date).getMonth() === currentMonth - 1).length;

        const tokensTrend = calculateTrend(currentPeriodTokens, previousPeriodTokens);

        // Calculate exchange trends
        const currentPeriodExchanges = exchangesData.filter(exchange => 
          new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth).length;
        
        const previousPeriodExchanges = exchangesData.filter(exchange => 
          new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth - 1).length;

        const exchangesTrend = calculateTrend(currentPeriodExchanges, previousPeriodExchanges);

        // Calculate exchange weight trends
        const currentPeriodWeight = filteredExchanges
          .filter(exchange => new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth)
          .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);
        
        const previousPeriodWeight = filteredExchanges
          .filter(exchange => new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth - 1)
          .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

        const weightTrend = calculateTrend(currentPeriodWeight, previousPeriodWeight);

        // Update sparkline data with proper calculations
        setSparklineData({
          revenue: last7Days.map(date => {
            const dayTokens = processedTokens.filter(token => 
              new Date(token.date).toLocaleDateString() === date);
            return {
              value: dayTokens.reduce((sum, token) => sum + (token.totalAmount || 0), 0),
              date
            };
          }),
          expenses: last7Days.map(date => {
            const dayExpenses = expensesRes.data.filter(expense => 
              new Date(expense.date).toLocaleDateString() === date);
            return {
              value: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
              date
            };
          }),
          profit: last7Days.map(date => {
            const dayRevenue = processedTokens
              .filter(token => new Date(token.date).toLocaleDateString() === date)
              .reduce((sum, token) => sum + (token.totalAmount || 0), 0);
            const dayExpenses = expensesRes.data
              .filter(expense => new Date(expense.date).toLocaleDateString() === date)
              .reduce((sum, expense) => sum + expense.amount, 0);
            return {
              value: dayRevenue - dayExpenses,
              date
            };
          }),
          margin: last7Days.map(date => {
            const dayRevenue = processedTokens
              .filter(token => new Date(token.date).toLocaleDateString() === date)
              .reduce((sum, token) => sum + (token.totalAmount || 0), 0);
            const dayExpenses = expensesRes.data
              .filter(expense => new Date(expense.date).toLocaleDateString() === date)
              .reduce((sum, expense) => sum + expense.amount, 0);
            const dayProfit = dayRevenue - dayExpenses;
            return {
              value: dayRevenue ? (dayProfit / dayRevenue) * 100 : 0,
              date
            };
          }),
          customers: last7Days.map(date => ({
            value: entriesData.filter(entry => 
              new Date(entry.createdAt).toLocaleDateString() <= date).length,
            date
          })),
          skinTests: last7Days.map(date => ({
            value: processedTokens
              .filter(token => 
                new Date(token.date).toLocaleDateString() <= date && 
                token.test === 'Skin Testing'
              ).length,
            date
          })),
          photoTests: last7Days.map(date => ({
            value: processedTokens
              .filter(token => 
                new Date(token.date).toLocaleDateString() <= date && 
                token.test === 'Photo Testing'
              ).length,
            date
          })),
          weights: last7Days.map(date => {
            const dayExchanges = exchangesData.filter(exchange => 
              new Date(exchange.date.split('-').reverse().join('-')).toLocaleDateString() === date);
            return {
              value: dayExchanges.reduce((sum, exchange) => 
                sum + parseFloat(exchange.weight || '0'), 0),
              date
            };
          })
        });

        // Calculate today's total
        const calculateTodayTotal = (tokenData, expenseData) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to start of day

          // Calculate today's revenue from tokens
          const todayTokens = tokenData.filter(token => {
            const tokenDate = new Date(token.date);
            tokenDate.setHours(0, 0, 0, 0);
            return tokenDate.getTime() === today.getTime();
          });
          
          const todayRevenue = todayTokens.reduce((sum, token) => {
            return sum + parseFloat(token.amount || 0);
          }, 0);

          // Calculate today's expenses
          const todayExpenses = expenseData.filter(expense => {
            const expenseDate = new Date(expense.date);
            expenseDate.setHours(0, 0, 0, 0);
            return expenseDate.getTime() === today.getTime();
          });

          const todayExpenseTotal = todayExpenses.reduce((sum, expense) => {
            return sum + parseFloat(expense.amount || 0);
          }, 0);

          // Calculate net total (revenue - expenses)
          const netTotal = todayRevenue - todayExpenseTotal;
          
          // Format amounts with Indian currency format
          const formatAmount = (amount) => new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(amount);

          setTodayTotal({
            revenue: todayRevenue,
            expenses: todayExpenseTotal,
            netTotal: netTotal,
            formattedRevenue: formatAmount(todayRevenue),
            formattedExpenses: formatAmount(todayExpenseTotal),
            formattedNetTotal: formatAmount(netTotal)
          });
        };

        calculateTodayTotal(tokenData, expensesRes.data);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error('Failed to load dashboard data');
      }
    };

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
      toast.success('Dashboard updated!', {
        icon: '🔄',
        position: 'top-right',
      });
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Calculate metrics from tokens and expenses
  const totalRevenue = tokens.reduce((sum, token) => sum + (token.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

  // Calculate month-over-month growth for trends
  const currentMonth = new Date().getMonth();
  
  // Revenue trend calculation
  const currentMonthRevenue = tokens
    .filter(token => new Date(token.date).getMonth() === currentMonth)
    .reduce((sum, token) => sum + (token.totalAmount || 0), 0);
  
  const lastMonthRevenue = tokens
    .filter(token => new Date(token.date).getMonth() === currentMonth - 1)
    .reduce((sum, token) => sum + (token.totalAmount || 0), 0);

  const revenueGrowth = lastMonthRevenue ? 
    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // Expenses trend calculation
  const currentMonthExpenses = expenses
    .filter(expense => new Date(expense.date).getMonth() === currentMonth)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const lastMonthExpenses = expenses
    .filter(expense => new Date(expense.date).getMonth() === currentMonth - 1)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const expensesGrowth = lastMonthExpenses ? 
    ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

  // Net Profit trend calculation
  const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
  const lastMonthProfit = lastMonthRevenue - lastMonthExpenses;
  const profitGrowth = lastMonthProfit ? 
    ((currentMonthProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0;

  // Profit Margin trend calculation
  const currentMonthMargin = currentMonthRevenue ? (currentMonthProfit / currentMonthRevenue) * 100 : 0;
  const lastMonthMargin = lastMonthRevenue ? (lastMonthProfit / lastMonthRevenue) * 100 : 0;
  const marginGrowth = lastMonthMargin ? 
    ((currentMonthMargin - lastMonthMargin) / lastMonthMargin) * 100 : 0;

  // Customer trends
  const currentPeriodCustomers = entries.filter(entry => 
    new Date(entry.createdAt).getMonth() === currentMonth).length;
  
  const previousPeriodCustomers = entries.filter(entry => 
    new Date(entry.createdAt).getMonth() === currentMonth - 1).length;

  const customersTrend = previousPeriodCustomers ? 
    ((currentPeriodCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 : 0;

  // Token trends
  const currentPeriodTokens = tokens.filter(token => 
    new Date(token.date).getMonth() === currentMonth).length;
  
  const previousPeriodTokens = tokens.filter(token => 
    new Date(token.date).getMonth() === currentMonth - 1).length;

  const tokensTrend = previousPeriodTokens ? 
    ((currentPeriodTokens - previousPeriodTokens) / previousPeriodTokens) * 100 : 0;

  // Exchange trends
  const currentPeriodExchanges = exchanges.filter(exchange => 
    new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth).length;
  
  const previousPeriodExchanges = exchanges.filter(exchange => 
    new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth - 1).length;

  const exchangesTrend = previousPeriodExchanges ? 
    ((currentPeriodExchanges - previousPeriodExchanges) / previousPeriodExchanges) * 100 : 0;

  // Weight trends
  const currentPeriodWeight = exchanges
    .filter(exchange => new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth)
    .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);
  
  const previousPeriodWeight = exchanges
    .filter(exchange => new Date(exchange.date.split('-').reverse().join('-')).getMonth() === currentMonth - 1)
    .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

  const weightTrend = previousPeriodWeight ? 
    ((currentPeriodWeight - previousPeriodWeight) / previousPeriodWeight) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="h-32 w-32 border-4 border-yellow-500 rounded-full border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="p-6 text-red-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Error loading dashboard: {error}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      <Toaster />
      
      {/* Date Range Picker with Today's Total */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-amber-700">Today's Revenue</span>
            <span className="text-lg font-bold text-yellow-600">{todayTotal.formattedRevenue}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-amber-700">Today's Expenses</span>
            <span className="text-lg font-bold text-red-600">{todayTotal.formattedExpenses}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-amber-700">Today's Net Total</span>
            <span className={`text-lg font-bold ${todayTotal.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {todayTotal.formattedNetTotal}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label htmlFor="fromDate" className="text-sm font-medium text-amber-700 whitespace-nowrap">From:</label>
            <input
              type="date"
              id="fromDate"
              className="form-input w-full sm:w-auto rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-1 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500 text-amber-700 [&::-webkit-calendar-picker-indicator]:text-yellow-500 [&::-webkit-calendar-picker-indicator]:filter-yellow"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              style={{ colorScheme: 'yellow' }}
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label htmlFor="toDate" className="text-sm font-medium text-amber-700 whitespace-nowrap">To:</label>
            <input
              type="date"
              id="toDate"
              className="form-input w-full sm:w-auto rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-1 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500 text-amber-700 [&::-webkit-calendar-picker-indicator]:text-yellow-500 [&::-webkit-calendar-picker-indicator]:filter-yellow"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              style={{ colorScheme: 'yellow' }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`}
          trend={revenueGrowth}
          icon={CurrencyRupeeIcon}
          description="Total revenue from tokens"
          sparklineData={sparklineData.revenue}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard 
          title="Total Expenses" 
          value={`₹${totalExpenses.toLocaleString()}`}
          trend={expensesGrowth}
          icon={ScaleIcon}
          description="Total expenses this month"
          sparklineData={sparklineData.expenses}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard 
          title="Net Profit" 
          value={`₹${netProfit.toLocaleString()}`}
          trend={profitGrowth}
          icon={ReceiptPercentIcon}
          description="Net profit this month"
          sparklineData={sparklineData.profit}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard 
          title="Profit Margin" 
          value={`${profitMargin}%`}
          trend={marginGrowth}
          icon={UserGroupIcon}
          description="Current profit margin"
          sparklineData={sparklineData.margin}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard 
          title="Customers" 
          value={metrics.totalCustomers.toString()}
          trend={customersTrend}
          icon={UserGroupIcon}
          description="Total number of customers"
          sparklineData={sparklineData.customers}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard
          title="Token" 
          value={
            <div className="flex flex-col space-y-1">
              <div className="text-lg font-semibold text-yellow-900">
                Total : {metrics.totalTokens}
              </div>
              <div className="flex flex-col items-center text-sm">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                  <span className="text-yellow-600">Skin :</span>
                  <span className="ml-1 font-medium">{metrics.skinTestCount}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                  <span className="text-yellow-600">Photo:</span>
                  <span className="ml-1 font-medium">{metrics.photoTestCount}</span>
                </div>
              </div>
            </div>
          }
          trend={tokensTrend}
          icon={BeakerIcon}
          description="Test-wise token breakdown"
          sparklineData={sparklineData.skinTests}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard 
          title="Total Exchange" 
          value={metrics.totalExchanges.toString()}
          trend={exchangesTrend}
          icon={ScaleIcon}
          description="Total number of exchanges"
          sparklineData={sparklineData.weights}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
        <DashboardCard 
          title="Pure Exchange" 
          value={
            <div className="flex flex-col text-sm">
              <span>Weight: {(metrics.totalWeight || 0).toFixed(3)} g</span>
              <span>ExWeight: {(metrics.totalExWeight || 0).toFixed(3)} g</span>
            </div>
          }
          trend={weightTrend}
          icon={ArrowsRightLeftIcon}
          description="Exchange weights breakdown"
          sparklineData={sparklineData.weights}
          className="bg-white"
          iconClassName="text-yellow-600"
          valueClassName="text-yellow-900"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Revenue vs Expenses</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.revenue}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="totalAmount" name="Revenue" stroke="#F7DC6F" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Profit Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.profit}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="totalAmount" 
                  name="Profit"
                  fill="#F7DC6F" 
                  stroke="#F2C464" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full divide-y divide-yellow-200">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 hover:bg-yellow-50 px-2 rounded"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                  <span className="text-sm font-medium text-yellow-900">{activity.action}</span>
                  <span className="text-xs text-yellow-600 mt-1 sm:mt-0">{activity.time}</span>
                </div>
                {activity.amount > 0 && (
                  <span className="text-sm text-yellow-600 mt-1 sm:mt-0">
                    ₹{activity.amount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
