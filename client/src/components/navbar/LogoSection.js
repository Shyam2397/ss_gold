import React from 'react';
import Logo from '../../asset/logo.png';

const LogoSection = ({ onToggleSidebar }) => {
  return (
    <div className="flex items-center">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center ml-4">
        <img src={Logo} alt="SS Gold" className="h-8 w-auto" />
        <span className="ml-2 text-xl font-semibold text-amber-900">SS Gold</span>
      </div>
    </div>
  );
};

export default LogoSection;
