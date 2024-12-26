import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/login/Login";
import MainLayout from "./components/mainLayout/MainLayout";
import Dashboard from "./pages/Dashboard";
import NewEntries from "./pages/NewEntries";
import SkinTesting from "./pages/SkinTesting";
import PhotoTesting from "./pages/PhotoTesting";
import Token from "./pages/Token";
import Customerdata from "./pages/Customerdata";
import Tokendata from "./pages/Tokendata";
import Skintestdata from "./pages/Skintestdata";

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  return (
    <Router>
      <Routes>
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
          <Route path="/customer-data" element={<Customerdata />} />
          <Route path="/token-data" element={<Tokendata />} />
          <Route path="/skintest-data" element={<Skintestdata />} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
