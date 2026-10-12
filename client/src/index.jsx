import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { logoutUser } from './services/authService';
import loginBg from './asset/loginBG.png';

// Closing the application ends the session: drop any credentials left behind by
// the previous run so every launch starts at the login screen. This runs before
// React mounts so no component fires a request with the stale token.
logoutUser();
if (window.location.hash && window.location.hash !== '#/') {
  window.location.hash = '#/';
}

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

const preloadImage = (src) => new Promise((resolve) => {
  if (!src) {
    resolve();
    return;
  }

  const image = new Image();
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    resolve();
  };

  const timeoutId = setTimeout(done, 3000);

  image.onload = () => {
    clearTimeout(timeoutId);
    if (typeof image.decode === 'function') {
      image.decode().then(done).catch(done);
    } else {
      done();
    }
  };
  image.onerror = () => {
    clearTimeout(timeoutId);
    done();
  };

  image.src = src;
});

// Create root with concurrent features
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render with selective StrictMode once the login backdrop is decoded so the
// first painted frame already contains the background (no white flash).
preloadImage(loginBg).finally(() => {
  root.render(
    process.env.NODE_ENV === 'development' ? (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ) : (
      <App />
    )
  );
});

// Performance monitoring
reportWebVitals(reportMetric);
