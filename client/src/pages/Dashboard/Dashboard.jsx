import React from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import useDashboardData from './components/useDashboardData';
import DashboardHeader from './components/DashboardHeader';
import MetricsGrid from './components/MetricsGrid';
import DashboardCharts from './components/DashboardCharts';
import RecentActivity from './components/RecentActivity';

function Dashboard() {
  const {
    tokens, entries, expenses, exchanges, loading, error, recentActivities,
    todayTotal, dateRange, setDateRange, metrics, sparklineData, selectedPeriod
  } = useDashboardData();

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
      <DashboardHeader todayTotal={todayTotal} dateRange={dateRange} onDateRangeChange={setDateRange} />
      <MetricsGrid 
        metrics={metrics} 
        tokens={tokens} 
        expenses={expenses} 
        entries={entries} 
        exchanges={exchanges} 
        sparklineData={sparklineData} 
        selectedPeriod={selectedPeriod}
      />
      <DashboardCharts tokens={tokens} expenses={expenses} entries={entries} exchanges={exchanges} />
      <RecentActivity activities={recentActivities} />
    </motion.div>
  );
}

export default Dashboard;