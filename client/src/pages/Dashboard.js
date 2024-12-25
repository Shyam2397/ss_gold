import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FiUsers, 
  FiTag, 
  FiActivity, 
  FiCamera,
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://localhost:5000';

const StatCard = ({ icon: Icon, title, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white p-6 rounded-xl shadow-sm border border-${color}-100`}
  >
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        <Icon className={`h-6 w-6 text-${color}-500`} />
      </div>
      {trend && (
        <span className={`text-sm font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="mt-4 text-2xl font-bold text-gray-900">{value}</h3>
    <p className="mt-1 text-sm text-gray-500">{title}</p>
  </motion.div>
);

const MonthlyTestChart = ({ tokens }) => {
  // Process tokens data to get monthly counts and amounts
  const processMonthlyData = (tokens) => {
    // Create a map to store monthly data
    const monthlyData = {};
    
    // Process each token
    tokens.forEach(token => {
      if (!token.date) return;
      
      // Parse the date
      const date = new Date(token.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Initialize month data if not exists
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          skinTestCount: 0,
          photoTestCount: 0,
          totalAmount: 0
        };
      }
      
      // Count tests and sum amounts
      if (token.test === 'Skin Testing') {
        monthlyData[monthKey].skinTestCount++;
      } else if (token.test === 'Photo Testing') {
        monthlyData[monthKey].photoTestCount++;
      }
      
      // Add amount (assuming amount is a number)
      monthlyData[monthKey].totalAmount += (token.amount || 0);
    });
    
    // Sort and limit to last 6 months
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
  };
  
  // Process the data
  const processedData = processMonthlyData(tokens);
  
  // Prepare chart data
  const chartData = {
    labels: processedData.map(([month]) => month),
    datasets: [
      {
        type: 'bar',
        label: 'Skin Test Count',
        data: processedData.map(([, data]) => data.skinTestCount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        yAxisID: 'y-count'
      },
      {
        type: 'bar',
        label: 'Photo Test Count',
        data: processedData.map(([, data]) => data.photoTestCount),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        yAxisID: 'y-count'
      },
      {
        type: 'line',
        label: 'Total Amount',
        data: processedData.map(([, data]) => data.totalAmount),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        yAxisID: 'y-amount'
      }
    ]
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      'y-count': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Test Count'
        }
      },
      'y-amount': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Total Amount'
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Monthly Tests and Total Amount'
      }
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

const TestTypeDistributionChart = ({ tokens, entries }) => {
  // Process tokens to get test type distribution
  const processTestTypeDistribution = (tokens) => {
    const testTypeCounts = {
      'Skin Testing': 0,
      'Photo Testing': 0,
      'Other': 0
    };

    tokens.forEach(token => {
      if (token.test === 'Skin Testing') {
        testTypeCounts['Skin Testing']++;
      } else if (token.test === 'Photo Testing') {
        testTypeCounts['Photo Testing']++;
      } else {
        testTypeCounts['Other']++;
      }
    });

    return testTypeCounts;
  };

  // Process entries to get customer segment distribution
  const processCustomerDistribution = (entries) => {
    const placeCounts = {};

    entries.forEach(entry => {
      const place = entry.place || 'Unknown';
      placeCounts[place] = (placeCounts[place] || 0) + 1;
    });

    return placeCounts;
  };

  // Process data
  const testTypeData = processTestTypeDistribution(tokens);
  const customerDistributionData = processCustomerDistribution(entries);

  // Prepare chart data for test types
  const testTypeChartData = {
    labels: Object.keys(testTypeData),
    datasets: [{
      data: Object.values(testTypeData),
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',  // Skin Testing
        'rgba(255, 99, 132, 0.6)',  // Photo Testing
        'rgba(255, 206, 86, 0.6)'   // Other
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Prepare chart data for customer distribution
  const customerDistributionChartData = {
    labels: Object.keys(customerDistributionData),
    datasets: [{
      data: Object.values(customerDistributionData),
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribution Overview'
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Type Distribution</h3>
        <Pie data={testTypeChartData} options={chartOptions} />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Distribution by Place</h3>
        <Pie data={customerDistributionChartData} options={chartOptions} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState([
    { icon: FiUsers, title: 'Total Customers', value: '0', trend: 0, color: 'amber' },
    { icon: FiTag, title: 'Active Tokens', value: '0', trend: 0, color: 'amber' },
    { icon: FiActivity, title: 'Active Skin Testing', value: '0', trend: 0, color: 'amber' },
    { icon: FiCamera, title: 'Active Photo Testing', value: '0', trend: 0, color: 'amber' },
  ]);
  const [tokens, setTokens] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch total customers
        const customersResponse = await axios.get(`${API_URL}/entries`);
        const totalCustomers = customersResponse.data.length;
        setEntries(customersResponse.data);
        
        // Fetch tokens
        const tokensResponse = await axios.get(`${API_URL}/tokens`);
        const activeTokens = tokensResponse.data.length;
        setTokens(tokensResponse.data);
        
        // Count active skin testing and photo testing from tokens
        const activeSkinTests = tokensResponse.data.filter(token => token.test === 'Skin Testing').length;
        const activePhotoTests = tokensResponse.data.filter(token => token.test === 'Photo Testing').length;
        
        // Update stats
        setStats([
          { icon: FiUsers, title: 'Total Customers', value: totalCustomers.toString(), trend: null, color: 'amber' },
          { icon: FiTag, title: 'Active Tokens', value: activeTokens.toString(), trend: null, color: 'amber' },
          { icon: FiActivity, title: 'Active Skin Testing', value: activeSkinTests.toString(), trend: null, color: 'amber' },
          { icon: FiCamera, title: 'Active Photo Testing', value: activePhotoTests.toString(), trend: null, color: 'amber' },
        ]);

        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard 
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              color={stat.color}
            />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Sections */}
        <MonthlyTestChart tokens={tokens} />
        <TestTypeDistributionChart tokens={tokens} entries={entries} />
      </div>
    </div>
  );
};

export default Dashboard;
