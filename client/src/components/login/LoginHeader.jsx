import React from 'react';
import Logo from '../../asset/logo.png';

const LoginHeader = () => (
  <div className="flex flex-col items-center pt-2">
    <img 
      src={Logo} 
      alt="SS Gold" 
      className="h-20 w-auto transition-transform hover:scale-105" 
    />
    <div className="text-center mt-3">
      <h2 className="text-2xl font-bold text-amber-900">
        Welcome Back
      </h2>
      <p className="text-xs text-gray-500 mt-1">
        Sign in to continue
      </p>
    </div>
  </div>
);

export default LoginHeader;
