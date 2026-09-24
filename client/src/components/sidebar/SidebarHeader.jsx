import React, { memo } from 'react';
import { FiX } from 'react-icons/fi';
import { useSidebar } from './SidebarProvider';
import { useCompanyDetails, DEFAULT_BRANDING } from '../../context/CompanyDetailsContext';

export const SidebarHeader = memo(({ isMobile = false }) => {
  const { open, setOpen } = useSidebar();
  const { companyDetails } = useCompanyDetails();
  const companyName = (companyDetails?.name || '').trim() || DEFAULT_BRANDING.name;
  const companyLogo = companyDetails?.logo || DEFAULT_BRANDING.logo;

  return (
    <div className={`flex items-center ${isMobile ? 'h-16 px-4' : 'h-20 px-4'} border-b border-amber-100 flex-shrink-0`}>
      <div className="flex items-center align-middle overflow-hidden">
        <img
          src={companyLogo}
          alt={companyName}
          className={`${isMobile ? 'h-8 w-8' : 'h-8 w-9'} flex-shrink-0`}
        />
        {(open || isMobile) && (
          <span className={`ml-${isMobile ? '2' : '3'} ${isMobile ? 'text-xl font-semibold' : 'pt-1 text-3xl font-bold'} text-amber-900 truncate`}>
            {companyName}
          </span>
        )}
      </div>
      {isMobile && (
        <button onClick={() => setOpen(false)} className="ml-auto p-2 rounded-lg hover:bg-gray-100">
          <FiX className="h-6 w-6 text-gray-600" />
        </button>
      )}
    </div>
  );
});