import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-amber-500" />
    </div>
    <input
      id={id}
      name={id}
      type={type}
      required
      value={value}
      onChange={onChange}
      className="appearance-none block w-full pl-12 pr-4 py-3 border-2 border-amber-200 rounded-xl 
                placeholder-gray-400 bg-white text-amber-900 text-lg
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                transition duration-200 ease-in-out font-bold"
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
    <form className="mt-8 space-y-8" onSubmit={onSubmit}>
      <div className="space-y-5">
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

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-red-50 p-4 text-sm text-red-500"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-3 px-4 
                   border border-transparent text-lg font-medium rounded-xl text-white
                   bg-gradient-to-r from-amber-500 to-amber-600
                   hover:from-amber-600 hover:to-amber-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition duration-200 ease-in-out"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
