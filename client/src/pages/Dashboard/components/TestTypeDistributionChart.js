import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const TestTypeDistributionChart = ({ tokens, entries }) => {
  // Calculate test type distribution
  const testTypeDistribution = {
    'Skin Testing': 0,
    'Photo Testing': 0,
    'Other': 0
  };

  // Count tokens by test type
  tokens.forEach(token => {
    if (token.test === 'Skin Testing') {
      testTypeDistribution['Skin Testing']++;
    } else if (token.test === 'Photo Testing') {
      testTypeDistribution['Photo Testing']++;
    } else {
      testTypeDistribution['Other']++;
    }
  });

  // Prepare chart data
  const chartData = {
    labels: Object.keys(testTypeDistribution),
    datasets: [
      {
        data: Object.values(testTypeDistribution),
        backgroundColor: [
          'rgba(212, 175, 55, 0.8)',   // Gold for Skin Testing
          'rgba(184, 115, 51, 0.8)',   // Bronze/Rose Gold for Photo Testing
          'rgba(192, 192, 192, 0.8)'   // Silver for Other
        ],
        borderColor: [
          'rgb(212, 175, 55)',
          'rgb(184, 115, 51)',
          'rgb(192, 192, 192)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#4B5563',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-[350px] w-full">
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
};

export default TestTypeDistributionChart;
