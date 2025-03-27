import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Optimize metric reporting
const reportMetric = (metric) => {
  // Only report metrics that exceed thresholds
  const thresholds = {
    FCP: 2000,
    LCP: 2500,
    CLS: 0.1,
    FID: 100,
    TTFB: 600
  };

  if (metric.value > (thresholds[metric.name] || 0)) {
    console.warn(`${metric.name} exceeded threshold:`, metric.value);
  }
};

// Create root with concurrent features
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render with selective StrictMode
root.render(
  process.env.NODE_ENV === 'development' ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);

// Performance monitoring
reportWebVitals(reportMetric);
