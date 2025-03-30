import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TimeSelector from './TimeSelector';

const CHART_COLORS = {
  revenue: '#FFD93D',     // Modern gold
  expenses: '#FF6B6B',    // Soft red
  profit: '#4ADE80',      // Fresh green
  tokens: '#A78BFA',      // Lavender
  exchanges: '#60A5FA',   // Sky blue
  exchangeWeight: '#F472B6',  // Rose pink
  exchangeExWeight: '#C084FC', // Purple
  skinTest: '#38BDF8',    // Light blue
  photoTest: '#2DD4BF'    // Teal
};

const CHART_SERIES = [
  ['revenue', 'Revenue', CHART_COLORS.revenue, 'left'],
  ['expenses', 'Expenses', CHART_COLORS.expenses, 'left'],
  ['profit', 'Profit', CHART_COLORS.profit, 'left'],
  ['tokens', 'Total Tokens', CHART_COLORS.tokens, 'right'],
  ['skinTest', 'Skin Tests', CHART_COLORS.skinTest, 'right'],
  ['photoTest', 'Photo Tests', CHART_COLORS.photoTest, 'right'],
  ['exchangeCount', 'Exchange Count', CHART_COLORS.exchanges, 'right'],
  ['exchangeWeight', 'Impure Weight', CHART_COLORS.exchangeWeight, 'right'],
  ['exchangeExWeight', 'Pure Weight', CHART_COLORS.exchangeExWeight, 'right']
];

// Create a date cache for better performance
const dateCache = new Map();
const getDateKey = (date, format) => {
  const key = `${date}-${format}`;
  if (!dateCache.has(key)) {
    const d = new Date(date);
    // Adjust to local timezone by subtracting the offset
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    let formatted;
    switch (format) {
      case 'yearly':
        formatted = d.getFullYear().toString();
        break;
      case 'monthly':
        formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'weekly':
        const week = new Date(d);
        week.setDate(d.getDate() - d.getDay());
        formatted = `${week.getFullYear()}-${String(week.getMonth() + 1).padStart(2, '0')}-${String(week.getDate()).padStart(2, '0')}`;
        break;
      default:
        formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    dateCache.set(key, formatted);
  }
  return dateCache.get(key);
};

const DashboardCharts = ({ tokens, expenses, entries, exchanges }) => {
  const [period, setPeriod] = useState('daily');
  const [workerData, setWorkerData] = useState(null);
  
  // Initialize worker
  const worker = useMemo(() => {
    try {
      return new Worker(
        new URL('../workers/chartProcessor.js', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      console.error('Worker initialization failed:', error);
      return null;
    }
  }, []);

  // Handle worker communication
  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = (event) => {
      if (event.data.error) {
        console.error('Worker error:', event.data.error);
        return;
      }
      setWorkerData(event.data);
    };

    worker.addEventListener('message', handleWorkerMessage);
    
    // Send initial data to worker
    worker.postMessage({ tokens, expenses, entries, exchanges });

    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.terminate();
    };
  }, [worker, tokens, expenses, entries, exchanges]);

  // Add data chunking for large datasets
  const chunkData = (data, size = 50) => {
    return Array.from({ length: Math.ceil(data.length / size) }, (_, i) =>
      data.slice(i * size, (i + 1) * size)
    );
  };

  const chartData = useMemo(() => {
    try {
      const today = new Date();
      let startDate = new Date();
      
      // Updated time ranges
      switch (period) {
        case 'yearly':
          startDate.setFullYear(today.getFullYear() - 5);
          break;
        case 'monthly':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'weekly':
          startDate.setMonth(today.getMonth() - 7); // Changed from 3 to 7 months
          startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to week start
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      // Pre-process data into maps for faster lookups
      const tokenMap = new Map();
      const expenseMap = new Map();
      const exchangeMap = new Map();

      // Improved weekly key generation for better aggregation
      const getWeekKey = (date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Adjust to local timezone
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay()); // Set to start of week (Sunday)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      // Process tokens with improved weekly handling
      tokens.forEach(token => {
        const date = new Date(token.date);
        const key = period === 'weekly' ? 
          getWeekKey(date) : 
          getDateKey(token.date, period);

        if (!tokenMap.has(key)) {
          tokenMap.set(key, { 
            amount: 0, 
            count: 0, 
            skinTest: 0, 
            photoTest: 0 
          });
        }
        const data = tokenMap.get(key);
        data.amount += parseFloat(token.amount) || 0;
        data.count++;
        if (token.test === "Skin Test") data.skinTest++;
        if (token.test === "Photo Testing") data.photoTest++;
      });

      // Process expenses with improved weekly handling
      expenses.forEach(expense => {
        const date = new Date(expense.date);
        const key = period === 'weekly' ? 
          getWeekKey(date) : 
          getDateKey(expense.date, period);

        if (!expenseMap.has(key)) {
          expenseMap.set(key, 0);
        }
        expenseMap.set(key, expenseMap.get(key) + (parseFloat(expense.amount) || 0));
      });

      // Process exchanges with improved weekly handling
      exchanges.forEach(exchange => {
        if (!exchange.date) return;
        try {
          const [day, month, year] = exchange.date.split('/');
          const date = new Date(year, month - 1, day);
          const key = period === 'weekly' ? 
            getWeekKey(date) : 
            getDateKey(date.toISOString(), period);

          if (!exchangeMap.has(key)) {
            exchangeMap.set(key, { count: 0, weight: 0, exweight: 0 });
          }
          const data = exchangeMap.get(key);
          data.count++;
          data.weight += parseFloat(exchange.weight || '0');
          data.exweight += parseFloat(exchange.exweight || '0');
        } catch (err) {
          console.error('Error processing exchange:', err);
        }
      });

      // Generate data points with additional metrics
      const dataPoints = new Map();
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + (period === 'weekly' ? 7 : 1))) {
        const key = period === 'weekly' ? getWeekKey(d) : getDateKey(d, period);
        const tokenData = tokenMap.get(key) || { 
          amount: 0, count: 0, skinTest: 0, photoTest: 0 
        };
        const expenseAmount = expenseMap.get(key) || 0;
        const exchangeData = exchangeMap.get(key) || { count: 0, weight: 0, exweight: 0 };
        const profit = tokenData.amount - expenseAmount;

        dataPoints.set(key, {
          date: key,
          revenue: tokenData.amount,
          expenses: expenseAmount,
          profit: profit,
          tokens: tokenData.count,
          skinTest: tokenData.skinTest,
          photoTest: tokenData.photoTest,
          exchangeCount: exchangeData.count,
          exchangeWeight: exchangeData.weight,
          exchangeExWeight: exchangeData.exweight
        });
      }

      return Array.from(dataPoints.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [tokens, expenses, exchanges, period]);

  const formatDate = useCallback((date) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      
      switch (period) {
        case 'yearly':
          return d.getFullYear().toString();
        case 'monthly':
          return d.toLocaleString('default', { month: 'short', year: 'numeric' });
        case 'weekly':
          // Improved weekly date formatting
          const weekEnd = new Date(d);
          weekEnd.setDate(d.getDate() + 6);
          return `${d.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.getDate()}`;
        default:
          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
      }
    } catch {
      return date;
    }
  }, [period]);

  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-900 px-5">Statistics</h3>
          <TimeSelector period={period} setPeriod={setPeriod} />
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer>
            <AreaChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
              baseValue="dataMin"
            >
              <defs>
                {Object.entries(CHART_COLORS).map(([name, color]) => (
                  <linearGradient key={name} id={`color${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                axisLine={false} 
                tickLine={false}
                dy={10}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false}
                tickFormatter={value => `₹${value.toLocaleString()}`}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dx={-10}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false}
                tickFormatter={value => value.toLocaleString()}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dx={10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  border: 'none',
                  padding: '12px 16px'
                }}
                labelStyle={{
                  color: '#374151',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
                itemStyle={{
                  padding: '4px 0'
                }}
                labelFormatter={formatDate}
                formatter={(value, name) => {
                  if (['revenue', 'expenses', 'profit'].includes(name.toLowerCase())) {
                    return [`₹${value.toLocaleString()}`, name];
                  } else if (name === 'Impure Weight' || name === 'Pure Weight') {
                    return [`${value.toFixed(3)} g`, name];
                  } else if (name === 'Exchange Count') {
                    return [`${value}`, 'Exchanges'];
                  } else if (name === 'Skin Tests' || name === 'Photo Tests') {
                    return [`${value}`, name];
                  } else {
                    return [value.toLocaleString(), name];
                  }
                }}
              />
              {CHART_SERIES.map(([key, name, color, axis]) => (
                <Area
                  key={key}
                  yAxisId={axis}
                  type="monotoneX"
                  dataKey={key}
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#color${key})`}
                  fillOpacity={1}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  dot={false}
                  activeDot={{
                    r: 8,
                    strokeWidth: 2,
                    stroke: '#fff',
                    fill: color,
                    boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardCharts);


