import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./components/login/Login";
import MainLayout from "./components/mainLayout/MainLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import NewEntries from "./components/NewEntries/NewEntries";
import SkinTesting from "./pages/SkinTesting";
import PhotoTesting from "./pages/PhotoTesting";
import Token from "./pages/Token/index";
import CustomerDataPage from "./pages/CustomerData/CustomerDataPage";
import Tokendata from "./pages/TokenData/TokenDataPage";
import Skintestdata from "./pages/SkinTestData/SkinTestDataPage";
import PureExchange from './pages/PureExchange/PureExchange';
import ExchangeDataPage from './pages/ExchangeData/ExchangeDataPage';

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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/entries" element={<NewEntries />} />
        <Route path="/token" element={<Token />} />
        <Route path="/skin-testing" element={<SkinTesting />} />
        <Route path="/photo-testing" element={<PhotoTesting />} />
        <Route path="/customer-data" element={<CustomerDataPage />} />
        <Route path="/token-data" element={<Tokendata />} />
        <Route path="/skintest-data" element={<Skintestdata />} />
        <Route path="/pure-exchange" element={<PureExchange />} />
        <Route path="/exchange-data" element={<ExchangeDataPage />} />
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
