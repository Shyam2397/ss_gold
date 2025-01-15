import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./components/login/Login";
import MainLayout from "./components/mainLayout/MainLayout";

// Lazy load all route components
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const NewEntries = React.lazy(() => import("./components/NewEntries/NewEntries"));
const SkinTesting = React.lazy(() => import("./pages/SkinTesting"));
const PhotoTesting = React.lazy(() => import("./pages/PhotoTesting"));
const Token = React.lazy(() => import("./pages/Token/index"));
const CustomerDataPage = React.lazy(() => import("./pages/CustomerData/CustomerDataPage"));
const Tokendata = React.lazy(() => import("./pages/TokenData/TokenDataPage"));
const Skintestdata = React.lazy(() => import("./pages/SkinTestData/SkinTestDataPage"));
const PureExchange = React.lazy(() => import('./pages/PureExchange/PureExchange'));
const ExchangeDataPage = React.lazy(() => import('./pages/ExchangeData/ExchangeDataPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
  </div>
);

const AppRoutes = ({ loggedIn, setLoggedIn }) => {
  const location = useLocation();
  
  return (
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
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/entries" element={
          <Suspense fallback={<LoadingFallback />}>
            <NewEntries />
          </Suspense>
        } />
        <Route path="/token" element={
          <Suspense fallback={<LoadingFallback />}>
            <Token />
          </Suspense>
        } />
        <Route path="/skin-testing" element={
          <Suspense fallback={<LoadingFallback />}>
            <SkinTesting />
          </Suspense>
        } />
        <Route path="/photo-testing" element={
          <Suspense fallback={<LoadingFallback />}>
            <PhotoTesting />
          </Suspense>
        } />
        <Route path="/customer-data" element={
          <Suspense fallback={<LoadingFallback />}>
            <CustomerDataPage />
          </Suspense>
        } />
        <Route path="/token-data" element={
          <Suspense fallback={<LoadingFallback />}>
            <Tokendata />
          </Suspense>
        } />
        <Route path="/skintest-data" element={
          <Suspense fallback={<LoadingFallback />}>
            <Skintestdata />
          </Suspense>
        } />
        <Route path="/pure-exchange" element={
          <Suspense fallback={<LoadingFallback />}>
            <PureExchange />
          </Suspense>
        } />
        <Route path="/exchange-data" element={
          <Suspense fallback={<LoadingFallback />}>
            <ExchangeDataPage />
          </Suspense>
        } />
        {/* Add more routes here */}
      </Route>
    </Routes>
  );
};

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  return (
    <Router>
      <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
    </Router>
  );
}

export default App;
