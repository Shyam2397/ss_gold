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
  <motion.div
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <label htmlFor={id} className="sr-only">{placeholder}</label>
    <div className="relative">
      <motion.div 
        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        whileHover={{ scale: 1.1 }}
      >
        <Icon className="h-5 w-5 text-amber-500" />
      </motion.div>
      <motion.input
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
  </motion.div>
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
    <motion.form 
      className="mt-8 space-y-6" 
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
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

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-600 text-sm mt-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          type="submit"
          disabled={loading}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
            loading ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200`}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            'Sign in'
          )}
        </motion.button>
      </div>
    </motion.form>
  );
};

export default LoginForm;
