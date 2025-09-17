import React from 'react';
import logo from '../../../assets/logo.png';

const Header = () => (
  <div className="p-0 m-0">
    <div className="flex items-start h-[65px]">
      <div className="w-[95px] h-[95px] flex-shrink-0 -mt-3">
        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
      </div>
      <div className="pt-2 -ml-2">
        <h1 
          className="text-[48px] font-bold leading-none"
          style={{
            background: 'linear-gradient(90deg, rgba(214, 164, 6, 1) 0%, rgba(255, 215, 0, 1) 50%, rgba(214, 164, 6, 1) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          SS GOLD
        </h1>
        <h2 className="text-[14px] font-bold text-red-600 -mt-1 text-right">Computer X-ray Testing</h2>
      </div>
    </div>
  </div>
);

export default Header;
