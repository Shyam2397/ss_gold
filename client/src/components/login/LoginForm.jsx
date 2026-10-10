import React, { useState } from 'react';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginInput = ({ 
  id, 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  inputRef,
  autoComplete,
  disabled,
  onKeyUp,
  onBlur,
  suffix
}) => (
  <div className="relative rounded-xl bg-gradient-to-r from-amber-300 via-amber-300 to-amber-300 p-[1.5px] transition-colors focus-within:from-gold-dark focus-within:via-gold-light focus-within:to-gold-dark focus-within:shadow-[0_0_0_3px_rgba(255,215,0,0.25)]">
    <div className="absolute inset-y-0 left-0 z-10 pl-2 flex items-center pointer-events-none">
      <Icon className="h-4 w-4 text-amber-600" />
    </div>
    <input
      id={id}
      name={id}
      type={type}
      required
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
      autoComplete={autoComplete}
      disabled={disabled}
      aria-label={placeholder}
      className={`w-full rounded-[10px] border-0 bg-white pl-8 ${suffix ? 'pr-8' : 'pr-1'} py-1.5 
                text-amber-900 
                focus:outline-none focus:ring-0
                disabled:text-amber-900/60 disabled:cursor-not-allowed
                transition duration-200 ease-in-out text-sm`}
      placeholder={placeholder}
    />
    {suffix && (
      <div className="absolute inset-y-0 right-0 z-10 pr-2 flex items-center">
        {suffix}
      </div>
    )}
  </div>
);

const LoginForm = ({ 
  username, 
  password, 
  error, 
  loading, 
  onUsernameChange, 
  onPasswordChange, 
  onSubmit,
  usernameInputRef 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const detectCapsLock = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

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
          inputRef={usernameInputRef}
          autoComplete="username"
          disabled={loading}
        />
        <div>
          <LoginInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={onPasswordChange}
            placeholder="Password"
            icon={FiLock}
            autoComplete="current-password"
            disabled={loading}
            onKeyUp={detectCapsLock}
            onBlur={() => setCapsLockOn(false)}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-amber-600 hover:text-amber-700 focus:outline-none"
              >
                {showPassword ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            }
          />
          <div className="min-h-4">
            {capsLockOn && (
              <div role="status" className="text-amber-600 text-xs text-center mt-1">
                Caps Lock is on
              </div>
            )}
          </div>
        </div>
        <div className="min-h-4" role="alert">
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
          className="w-full py-1.5 bg-gradient-to-r from-gold-bright via-gold to-gold-dark text-white rounded-xl 
                     hover:brightness-95 transition duration-300
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
