import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  
  return monthlyData;
};

const MonthlyTestChart = ({ tokens, width }) => {
  const monthlyData = processMonthlyData(tokens);
  const months = Object.keys(monthlyData).sort();
  
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Skin Tests',
        data: months.map(month => monthlyData[month].skinTestCount),
        borderColor: 'rgb(212, 175, 55)',
        backgroundColor: 'rgba(212, 175, 55, 0.5)',
        tension: 0.4
      },
      {
        label: 'Photo Tests',
        data: months.map(month => monthlyData[month].photoTestCount),
        borderColor: 'rgb(184, 115, 51)',
        backgroundColor: 'rgba(184, 115, 51, 0.5)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default MonthlyTestChart;
