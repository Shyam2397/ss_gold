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
  <div>
    <label htmlFor={id} className="sr-only">{placeholder}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-amber-500" />
      </div>
      <input
        id={id}
        name={id}
        type={type}
        required
        value={value}
        onChange={onChange}
        className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-amber-200 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all duration-200"
        placeholder={placeholder}
      />
    </div>
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
    <form className="mt-8 space-y-6" onSubmit={onSubmit}>
      <div className="space-y-4">
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
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="pb-6">
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
