import React from 'react';
import Logo from '../../asset/logo.png';

const LoginHeader = () => (
  <div className="flex flex-col items-center space-y-6">
    <img 
      src={Logo} 
      alt="SS Gold" 
      className="h-28 w-auto animate-fade-in" 
    />
    <div className="text-center space-y-2">
      <h2 className="text-4xl font-extrabold text-amber-900 tracking-tight">
        Welcome Back
      </h2>
      <p className="text-base text-gray-600">
        Please sign in to continue
      </p>
    </div>
  </div>
);

export default LoginHeader;
