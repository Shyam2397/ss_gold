import React from 'react';
import Logo from '../../asset/logo.png';

const LoginHeader = () => (
  <div className="flex flex-col items-center">
    <img src={Logo} alt="SS Gold" className="h-20 w-auto mb-4" />
    <h2 className="mt-2 text-3xl font-extrabold text-amber-900">Welcome Back</h2>
    <p className="mt-2 text-sm text-gray-600">Please sign in to continue</p>
  </div>
);

export default LoginHeader;
