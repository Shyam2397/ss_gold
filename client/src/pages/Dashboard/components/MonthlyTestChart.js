import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const processMonthlyData = (tokens) => {
  const monthlyData = {};
  
  tokens.forEach(token => {
    if (!token.date) return;
    
    const date = new Date(token.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        skinTestCount: 0,
        photoTestCount: 0,
        totalAmount: 0
      };
    }
    
    if (token.test === 'Skin Testing') {
      monthlyData[monthKey].skinTestCount++;
    } else if (token.test === 'Photo Testing') {
      monthlyData[monthKey].photoTestCount++;
    }
    
    monthlyData[monthKey].totalAmount += (token.amount || 0);
  });
  
  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
};

const MonthlyTestChart = ({ tokens }) => {
  const processedData = processMonthlyData(tokens);
  
  const chartData = {
    labels: processedData.map(([month]) => month),
    datasets: [
      {
        label: 'Skin Test Count',
        data: processedData.map(([, data]) => data.skinTestCount),
        borderColor: 'rgb(212, 175, 55)',
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
        borderColor: 'rgb(184, 115, 51)',
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
        borderColor: 'rgb(192, 192, 192)',
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
      }
    }
  };

  return (
    <div className="h-[350px] w-full">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default MonthlyTestChart;
