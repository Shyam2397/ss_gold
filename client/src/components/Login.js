import React, { useState } from "react";
import Logo from "../asset/logo.png";
import axios from "axios";
import "../styles/Login.css";

const Login = ({ setLoggedIn }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    // Reset errors
    setUsernameError("");
    setPasswordError("");
    setError("");

    // Validate inputs
    let isValid = true;

    if (username.trim().length < 3) {
      setUsernameError("Username must be at least 3 char long.");
      isValid = false;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 char long.");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // Proceed with login
    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      if (response.status === 200) {
        setLoggedIn(true); // Set login status to true
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Incorrect username or password.");
      } else {
        setError("An error occurred. Please try again later.");
      }
    }
  };

  return (
    <div>
      <div className="w-full h-svh bgcolors flex items-center justify-center">
        <form onSubmit={handleLogin}>
          <div className="card">
            <div>
              <img src={Logo} alt="Logo" className="h-20" />
            </div>
            <div className="company">SS GOLD</div>
            <div className="inputBox">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <span className="user">Username</span>
              {usernameError && (
                <p className="text-red-500 text-xs mt-2">{usernameError}</p>
              )}
            </div>

            <div className="inputBox">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <span>Password</span>
              {passwordError && (
                <p className="text-red-500 text-xs mt-2">{passwordError}</p>
              )}
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
            )}
            <button type="submit" className="enter">
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
