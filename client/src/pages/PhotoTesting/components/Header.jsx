import React from 'react';
import logo from '../../../assets/logo.png';

const Header = () => (
  <div className="flex items-center h-[65px]">
    <img src={logo} alt="Logo" className="w-[80px] h-[80px] object-contain -mt-[10px] -ml-[10px]" />
    <div>
      <h1 
        className="text-[42px] font-bold leading-none ml-2"
        style={{
          background: 'linear-gradient(90deg, rgba(214,164,6,1) 0%, rgba(255,215,0,1) 50%, rgba(214,164,6,1) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent'
        }}
      >
        SS GOLD
      </h1>
      <h2 className="text-[15px] font-bold text-red-600 -mt-[5px] text-right">Computer X-ray Testing</h2>
    </div>
  </div>
);

export default Header;
