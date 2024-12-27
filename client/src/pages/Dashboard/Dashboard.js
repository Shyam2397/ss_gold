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
import { Pie, Line } from 'react-chartjs-2';

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
  
  // Chart data
  const chartData = {
    labels: processedData.map(([month]) => month),
    datasets: [
      {
        label: 'Skin Test Count',
        data: processedData.map(([, data]) => data.skinTestCount),
        borderColor: 'rgb(212, 175, 55)', // Gold
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'rgb(212, 175, 55)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2
      },
      {
        label: 'Photo Test Count',
        data: processedData.map(([, data]) => data.photoTestCount),
        borderColor: 'rgb(184, 115, 51)', // Bronze/Rose Gold
        backgroundColor: 'rgba(184, 115, 51, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'rgb(184, 115, 51)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2
      },
      {
        label: 'Total Amount',
        data: processedData.map(([, data]) => data.totalAmount),
        borderColor: 'rgb(192, 192, 192)', // Silver
        backgroundColor: 'rgba(192, 192, 192, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'rgb(192, 192, 192)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2
      }
    ]
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          padding: 10,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          padding: 10,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 5,
          useBorderRadius: true,
          color: '#4B5563',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        titleFont: {
          size: 13,
          weight: '600'
        },
        bodyFont: {
          size: 12
        },
        displayColors: false,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return ` ${context.dataset.label}: ${context.formattedValue}`;
          }
        }
      }
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-[400px]">
      <Line 
        data={chartData} 
        options={chartOptions} 
        className="w-full h-full"
      />
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
        'rgb(212, 175, 55)',  // Gold
        'rgb(184, 115, 51)',  // Bronze/Rose Gold
        'rgb(192, 192, 192)'  // Silver
      ],
      borderColor: 'white',
      borderWidth: 3,
      spacing: 2,
      hoverOffset: 8
    }]
  };

  // Prepare chart data for customer distribution
  const customerDistributionChartData = {
    labels: Object.keys(customerDistributionData),
    datasets: [{
      data: Object.values(customerDistributionData),
      backgroundColor: [
        'rgb(212, 175, 55)',  // Gold
        'rgb(184, 115, 51)',  // Bronze/Rose Gold
        'rgb(192, 192, 192)',  // Silver
        'rgb(205, 127, 50)',  // Copper
        'rgb(218, 165, 32)'   // Golden Rod
      ],
      borderColor: 'white',
      borderWidth: 3,
      spacing: 2,
      hoverOffset: 8
    }]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col min-h-[400px] justify-center items-center">
        <h3 className="text-xl font-bold text-gray-800 text-center w-full px-6 py-4">Test Type Distribution</h3>
        <div className="flex-grow flex items-center justify-center w-full">
          <Pie 
            data={testTypeChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: {
                padding: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: false
                },
                tooltip: {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  titleColor: '#1F2937',
                  bodyColor: '#4B5563',
                  borderColor: '#E5E7EB',
                  borderWidth: 1,
                  cornerRadius: 12,
                  padding: 16,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: '600'
                  },
                  bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 13
                  },
                  callbacks: {
                    label: function(context) {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const currentValue = context.parsed;
                      const percentage = ((currentValue / total) * 100).toFixed(1);
                      return ` ${context.label}: ${currentValue} (${percentage}%)`;
                    }
                  }
                }
              },
              cutout: '75%',
              radius: '90%',
              animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800,
                easing: 'easeOutQuart'
              },
              elements: {
                arc: {
                  borderWidth: 3,
                  borderColor: 'white',
                  borderRadius: 6,
                  hoverBorderWidth: 4,
                  hoverOffset: 8
                }
              }
            }} 
            className="max-w-[300px] max-h-[300px]"
          />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col min-h-[400px] justify-center items-center">
        <h3 className="text-xl font-bold text-gray-800 text-center w-full px-6 py-4">Customer Distribution</h3>
        <div className="flex-grow flex items-center justify-center w-full">
          <Pie 
            data={customerDistributionChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: {
                padding: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: false
                },
                tooltip: {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  titleColor: '#1F2937',
                  bodyColor: '#4B5563',
                  borderColor: '#E5E7EB',
                  borderWidth: 1,
                  cornerRadius: 12,
                  padding: 16,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: '600'
                  },
                  bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 13
                  },
                  callbacks: {
                    label: function(context) {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const currentValue = context.parsed;
                      const percentage = ((currentValue / total) * 100).toFixed(1);
                      return ` ${context.label}: ${currentValue} (${percentage}%)`;
                    }
                  }
                }
              },
              cutout: '75%',
              radius: '90%',
              animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800,
                easing: 'easeOutQuart'
              },
              elements: {
                arc: {
                  borderWidth: 3,
                  borderColor: 'white',
                  borderRadius: 6,
                  hoverBorderWidth: 4,
                  hoverOffset: 8
                }
              }
            }} 
            className="max-w-[300px] max-h-[300px]"
          />
        </div>
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
