import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring
reportWebVitals(metric => {
  // Log performance metrics
  console.log(metric);
  
  // You can send metrics to your analytics service here
  if (metric.name === 'FCP') {
    console.log('First Contentful Paint:', metric.value);
  }
  if (metric.name === 'LCP') {
    console.log('Largest Contentful Paint:', metric.value);
  }
  if (metric.name === 'CLS') {
    console.log('Cumulative Layout Shift:', metric.value);
  }
  if (metric.name === 'FID') {
    console.log('First Input Delay:', metric.value);
  }
  if (metric.name === 'TTFB') {
    console.log('Time to First Byte:', metric.value);
  }
});
