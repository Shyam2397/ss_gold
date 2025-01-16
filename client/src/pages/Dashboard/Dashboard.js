import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FiUsers, 
  FiTag, 
  FiActivity, 
  FiCamera,
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';

const API_URL = 'http://localhost:5000';

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

const StatCard = ({ icon: Icon, title, value, trend, color }) => {
  const trendClass = trend > 0 ? 'text-green-500' : 'text-red-500';
  const trendAnimation = trend > 0 ? 'animate-bounce' : 'animate-pulse';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendClass} ${trendAnimation}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="mt-4 text-2xl font-bold text-gray-900">{value}</h3>
      <p className="mt-1 text-sm text-gray-500">{title}</p>
    </div>
  );
};

const MonthlyTestChart = ({ tokens, width }) => {
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

const TestTypeDistributionChart = ({ tokens, entries, width }) => {
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

const ActivityFeed = ({ activities }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className={`p-2 rounded-full ${activity.iconBg}`}>
            {activity.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">{format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch entries
        const entriesResponse = await axios.get(`${API_URL}/entries`);
        const entries = entriesResponse.data;

        // Fetch tokens
        const tokensResponse = await axios.get(`${API_URL}/tokens`);
        const tokens = tokensResponse.data;

        // Calculate stats
        const totalUsers = entries.length;
        const totalTests = tokens.length;
        const activeTests = tokens.filter(token => !token.completed).length;

        setData({
          totalUsers,
          totalTests,
          activeTests,
          tokens,
          entries
        });

        toast.success('Dashboard data updated successfully');
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch dashboard data');
      }
    };

    fetchData();

    // Mock activity feed updates
    const mockActivities = [
      {
        message: 'New test result uploaded',
        timestamp: new Date(),
        icon: <FiCamera className="text-blue-500" />,
        iconBg: 'bg-blue-100'
      },
      {
        message: 'Customer profile updated',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        icon: <FiUsers className="text-green-500" />,
        iconBg: 'bg-green-100'
      },
      {
        message: 'New test scheduled',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        icon: <FiTag className="text-yellow-500" />,
        iconBg: 'bg-yellow-100'
      }
    ];
    setActivities(mockActivities);
  }, []);

  const stats = [
    { icon: FiUsers, title: 'Total Users', value: data?.totalUsers || 0, trend: 12, color: 'blue' },
    { icon: FiTag, title: 'Total Tests', value: data?.totalTests || 0, trend: 8, color: 'green' },
    { icon: FiActivity, title: 'Active Tests', value: data?.activeTests || 0, trend: -5, color: 'yellow' }
  ];

  return (
    <div ref={containerRef} className="min-h-screen p-6">
      <Toaster position="top-right" />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          {data && <MonthlyTestChart tokens={data.tokens} width={containerWidth / 2} />}
        </div>
        <div>
          {data && <TestTypeDistributionChart tokens={data.tokens} entries={data.entries} width={containerWidth / 2} />}
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />
    </div>
  );
};

export default Dashboard;
