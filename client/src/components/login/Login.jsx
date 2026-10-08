import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { useUser } from '../UserInterface/UserContext';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';

const Login = ({ setLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adoptSessionUser } = useUser();
  const usernameInputRef = useRef(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const validateForm = () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(username, password);
      
      if (result.success) {
        // Load the signed in account into context so the sidebar and the
        // forced password change gate see the current user straight away.
        await adoptSessionUser(result.user);
        setLoggedIn(true);
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 px-4 py-8 sm:px-8">
      <div className="max-w-sm w-full space-y-5 bg-white p-5 py-10 rounded-3xl shadow-lg">
        <LoginHeader />
        <LoginForm 
          username={username}
          password={password}
          error={error}
          loading={loading}
          usernameInputRef={usernameInputRef}
          onUsernameChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
          onPasswordChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default Login;
