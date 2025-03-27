import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/login/Login';
import MainLayout from './components/mainLayout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { routes, preloadRoute } from './routes';

// Prefetch component for route preloading
const PreFetchComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Preload the next possible routes based on current location
    routes.forEach(route => {
      if (route.path !== location.pathname) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route.path;
        document.head.appendChild(link);
        
        // Also preload the component
        preloadRoute(route.path);
      }
    });
  }, [location]);

  return null;
};

const AppRoutes = ({ loggedIn, setLoggedIn }) => {
  const location = useLocation();

  useEffect(() => {
    // Ensure proper scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <ErrorBoundary>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            loggedIn ? (
              <MainLayout setLoggedIn={setLoggedIn} />
            ) : (
              <Login setLoggedIn={setLoggedIn} />
            )
          }
        >
          {routes.map(({ path, Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          ))}
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  return (
    <Router>
      <PreFetchComponent />
      <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
    </Router>
  );
}

export default App;
