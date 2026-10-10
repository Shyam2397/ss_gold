import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { useUser } from '../UserInterface/UserContext';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import loginBg from '../../asset/loginBG.png';

const Login = ({ setLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adoptSessionUser } = useUser();
  const usernameInputRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  // Same behaviour as the Token page: clicking empty space returns focus to
  // the username field. Clicks on other controls (password, buttons, links,
  // labels) and submissions in flight are left alone.
  useEffect(() => {
    const container = pageRef.current;
    if (!container) return undefined;

    const handleMouseDown = (e) => {
      if (loading) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('input, textarea, select, button, a, label, [contenteditable="true"]')) return;
      // Deferred: the browser's default mousedown handling moves focus to
      // <body> after the handlers run, which would immediately blur the input
      // again. Same pattern as the Token page's focusCodeInput.
      requestAnimationFrame(() => {
        if (usernameInputRef.current && document.activeElement !== usernameInputRef.current) {
          usernameInputRef.current.focus();
        }
      });
    };

    container.addEventListener('mousedown', handleMouseDown);
    return () => container.removeEventListener('mousedown', handleMouseDown);
  }, [loading]);

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
    <div
      ref={pageRef}
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8 sm:px-8"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="max-w-sm w-full space-y-5 bg-white p-5 py-10 rounded-3xl shadow-[0_10px_40px_-5px_rgba(255,215,0,0.6)]">
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
