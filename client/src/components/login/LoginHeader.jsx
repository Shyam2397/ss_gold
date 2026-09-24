import React from 'react';
import { useCompanyDetails, DEFAULT_BRANDING } from '../../context/CompanyDetailsContext';

const LoginHeader = () => {
  const { companyDetails } = useCompanyDetails();
  const companyName = (companyDetails?.name || '').trim() || DEFAULT_BRANDING.name;
  const companyLogo = companyDetails?.logo || DEFAULT_BRANDING.logo;

  return (
    <div className="flex flex-col items-center pt-2">
      <img
        src={companyLogo}
        alt={companyName}
        className="h-20 w-auto transition-transform hover:scale-105"
      />
      <div className="text-center mt-3">
        <h2 className="text-2xl font-bold text-amber-900">
          {companyName}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Sign in to continue
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;