import React from 'react';
import { FiUser, FiLock } from 'react-icons/fi';

const LoginInput = ({ 
  id, 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon 
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
      <Icon className="h-4 w-4 text-amber-600" />
    </div>
    <input
      id={id}
      name={id}
      type={type}
      required
      value={value}
      onChange={onChange}
      className="w-full pl-8 pr-1 py-1.5 border rounded-xl 
                bg-white text-amber-900 
                border-amber-300 
                focus:outline-none focus:ring-1 focus:ring-amber-400
                transition duration-200 ease-in-out text-sm"
      placeholder={placeholder}
    />
  </div>
);

const LoginForm = ({ 
  username, 
  password, 
  error, 
  loading, 
  onUsernameChange, 
  onPasswordChange, 
  onSubmit 
}) => {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <LoginInput
          id="username"
          type="text"
          value={username}
          onChange={onUsernameChange}
          placeholder="Username"
          icon={FiUser}
        />
        <LoginInput
          id="password"
          type="password"
          value={password}
          onChange={onPasswordChange}
          placeholder="Password"
          icon={FiLock}
        />
        <div className="h-4">
          {error && (
            <div className="text-red-500 text-xs text-center">
              {error}
            </div>
          )}
        </div>
        <div className='pt-2'>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-1.5 bg-amber-600 text-white rounded-xl 
                     hover:bg-amber-700 transition duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-sm"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
