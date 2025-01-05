import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { loginUser } from '../../services/authService';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';

const Login = ({ setLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginUser(username, password);
      
      if (result.success) {
        localStorage.setItem('isLoggedIn', 'true');
        setLoggedIn(true);
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <LoginHeader />
        <LoginForm 
          username={username}
          password={password}
          error={error}
          loading={loading}
          onUsernameChange={(e) => setUsername(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default Login;
