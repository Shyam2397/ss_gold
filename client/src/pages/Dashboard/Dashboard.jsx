import React, { useState, useEffect } from 'react';
import { 
  CurrencyRupeeIcon, ScaleIcon, 
  ReceiptPercentIcon, UserGroupIcon, BeakerIcon, ArrowsRightLeftIcon 
} from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import DashboardCard from './components/DashboardCard';
import DashboardCharts from './components/DashboardCharts';
import DateRangeSelector from './components/DateRangeSelector';
import TodayStats from './components/TodayStats';



// Main Dashboard Component
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
          sum + parseFloat(exchange.exweight || '0'), 0)
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
          skinTestCount: processedTokens.filter(token => token.test?.toLowerCase() === 'skin testing' || token.test?.toLowerCase() === 'skin test').length,
          photoTestCount: processedTokens.filter(token => token.test?.toLowerCase() === 'photo testing' || token.test?.toLowerCase() === 'photo test').length,
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
            // Handle DD-MM-YYYY format by splitting and reversing
            const [day, month, year] = (token.date || '').split('-');
            if (!day || !month || !year) return false;
            const tokenDate = new Date(year, month - 1, day);
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
const totalRevenue = tokens.reduce((sum, token) => sum + (parseFloat(token.totalAmount) || 0), 0);
const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
const netProfit = totalRevenue - totalExpenses;
const profitMargin = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

// Get dates for last 7 days and previous 7 days
const today = new Date();
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);
const fourteenDaysAgo = new Date(today);
fourteenDaysAgo.setDate(today.getDate() - 14);

// Revenue trend calculation
const currentRevenue = tokens
  .filter(token => {
    const tokenDate = new Date(token.date.split('-').reverse().join('-'));
    return tokenDate >= sevenDaysAgo && tokenDate <= today;
  })
  .reduce((sum, token) => sum + (token.totalAmount || 0), 0);

const previousRevenue = tokens
  .filter(token => {
    const tokenDate = new Date(token.date.split('-').reverse().join('-'));
    return tokenDate >= fourteenDaysAgo && tokenDate < sevenDaysAgo;
  })
  .reduce((sum, token) => sum + (token.totalAmount || 0), 0);

const revenueGrowth = previousRevenue ? 
  ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2) : 0;

// Expenses trend calculation
const currentExpenses = expenses
  .filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= sevenDaysAgo && expenseDate <= today;
  })
  .reduce((sum, expense) => sum + expense.amount, 0);

const previousExpenses = expenses
  .filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= fourteenDaysAgo && expenseDate < sevenDaysAgo;
  })
  .reduce((sum, expense) => sum + expense.amount, 0);

const expensesGrowth = previousExpenses ? 
  ((currentExpenses - previousExpenses) / previousExpenses * 100).toFixed(2) : 0;

// Net Profit trend calculation
const currentProfit = currentRevenue - currentExpenses;
const previousProfit = previousRevenue - previousExpenses;
const profitGrowth = previousProfit ? 
  ((currentProfit - previousProfit) / previousProfit * 100).toFixed(2) : 0;

// Profit Margin trend calculation
const currentMargin = currentRevenue ? (currentProfit / currentRevenue) * 100 : 0;
const previousMargin = previousRevenue ? (previousProfit / previousRevenue) * 100 : 0;
const marginGrowth = previousMargin ? 
  ((currentMargin - previousMargin) / previousMargin * 100).toFixed(2) : 0;

// Customer trends
const currentCustomers = entries.filter(entry => {
  const entryDate = new Date(entry.createdAt);
  return entryDate >= sevenDaysAgo && entryDate <= today;
}).length;

const previousCustomers = entries.filter(entry => {
  const entryDate = new Date(entry.createdAt);
  return entryDate >= fourteenDaysAgo && entryDate < sevenDaysAgo;
}).length;

const customersTrend = previousCustomers ? 
  ((currentCustomers - previousCustomers) / previousCustomers * 100).toFixed(2) : 0;

// Token trends
const currentTokens = tokens.filter(token => {
  const tokenDate = new Date(token.date.split('-').reverse().join('-'));
  return tokenDate >= sevenDaysAgo && tokenDate <= today;
}).length;

const previousTokens = tokens.filter(token => {
  const tokenDate = new Date(token.date.split('-').reverse().join('-'));
  return tokenDate >= fourteenDaysAgo && tokenDate < sevenDaysAgo;
}).length;

const tokensTrend = previousTokens ? 
  ((currentTokens - previousTokens) / previousTokens) * 100 : 0;

// Exchange trends
const currentExchanges = exchanges.filter(exchange => {
  const exchangeDate = new Date(exchange.date.split('-').reverse().join('-'));
  return exchangeDate >= sevenDaysAgo && exchangeDate <= today;
}).length;

const previousExchanges = exchanges.filter(exchange => {
  const exchangeDate = new Date(exchange.date.split('-').reverse().join('-'));
  return exchangeDate >= fourteenDaysAgo && exchangeDate < sevenDaysAgo;
}).length;

const exchangesTrend = previousExchanges ? 
  ((currentExchanges - previousExchanges) / previousExchanges * 100).toFixed(2) : 0;

// Weight trends
const currentWeight = exchanges
  .filter(exchange => {
    const exchangeDate = new Date(exchange.date.split('-').reverse().join('-'));
    return exchangeDate >= sevenDaysAgo && exchangeDate <= today;
  })
  .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

const previousWeight = exchanges
  .filter(exchange => {
    const exchangeDate = new Date(exchange.date.split('-').reverse().join('-'));
    return exchangeDate >= fourteenDaysAgo && exchangeDate < sevenDaysAgo;
  })
  .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0);

const weightTrend = previousWeight ? 
  ((currentWeight - previousWeight) / previousWeight * 100).toFixed(2) : 0;

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
      <motion.div className="p-6 text-red-500">
        Error loading dashboard: {error}
      </motion.div>
    );
  }

  return (
    <motion.div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Toaster />
      
      {/* Date Range and Today's Total */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0">
        <TodayStats todayTotal={todayTotal} />
        <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
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
              <div className="text-lg font-bold text-yellow-900">
                Total : {metrics.totalTokens}
              </div>
              <div className="flex flex-row items-center text-sm">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                  <span className="ml-1 font-semibold">{metrics.skinTestCount}</span>
                </div>
                <div className="flex items-center ml-5">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></div>
                  <span className="ml-1 font-semibold">{metrics.photoTestCount}</span>
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
            <div className="flex flex-row justify-between w-full text-xl">
              <span>{(metrics.totalWeight || 0).toFixed(3)} g</span>
              <span className='ml-3'>{(metrics.totalExWeight || 0).toFixed(3)} g</span>
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

      {/* Charts */}
      <DashboardCharts sparklineData={sparklineData} />

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
