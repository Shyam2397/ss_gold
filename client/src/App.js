import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ 
        x: "100%", 
        opacity: 0,
        scale: 0.92,
        rotate: 2
      }}
      animate={{ 
        x: 0, 
        opacity: 1,
        scale: 1,
        rotate: 0
      }}
      exit={{ 
        x: "-100%", 
        opacity: 0,
        scale: 0.92,
        rotate: -2
      }}
      transition={{
        opacity: { duration: 0.3, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 100, damping: 15, mass: 0.5 },
        rotate: { type: "spring", stiffness: 120, damping: 20 },
        x: { type: "spring", stiffness: 80, damping: 15 }
      }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = ({ loggedIn, setLoggedIn }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
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
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/entries" element={<PageTransition><NewEntries /></PageTransition>} />
          <Route path="/token" element={<PageTransition><Token /></PageTransition>} />
          <Route path="/skin-testing" element={<PageTransition><SkinTesting /></PageTransition>} />
          <Route path="/photo-testing" element={<PageTransition><PhotoTesting /></PageTransition>} />
          <Route path="/customer-data" element={<PageTransition><CustomerDataPage /></PageTransition>} />
          <Route path="/token-data" element={<PageTransition><Tokendata /></PageTransition>} />
          <Route path="/skintest-data" element={<PageTransition><Skintestdata /></PageTransition>} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  return (
    <Router>
      <AnimatedRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
    </Router>
  );
}

export default App;
