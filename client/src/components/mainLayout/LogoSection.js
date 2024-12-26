import React from 'react';
import Logo from '../../asset/logo.png';

const LogoSection = () => {
  return (
    <div className="flex justify-center items-center bg-[#FFFCF5] m-3 max-[767px]:h-screen h-full rounded-xl">
      <img
        src={Logo}
        alt="Company Logo"
        className="h-64"
      />
    </div>
  );
};

export default LogoSection;
