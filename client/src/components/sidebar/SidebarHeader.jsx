import React, { memo } from 'react';
import { useSidebar } from './SidebarProvider';
import { useCompanyDetails, DEFAULT_BRANDING } from '../../context/CompanyDetailsContext';
import { Icons } from './SidebarIcons';

export const SidebarHeader = memo(({ isMobile = false }) => {
  const { open, setMobileOpen } = useSidebar();
  const { companyDetails } = useCompanyDetails();
  const companyName = (companyDetails?.name || '').trim() || DEFAULT_BRANDING.name;
  const companyLogo = companyDetails?.logo || DEFAULT_BRANDING.logo;

  return (
    <div className={`flex items-center ${isMobile ? 'h-16 px-4' : 'h-20 px-4'} border-b border-white/10 flex-shrink-0`}>
      <div className="flex items-center align-middle overflow-hidden">
        <img
          src={companyLogo}
          alt={companyName}
          className={`${isMobile ? 'h-8 w-8' : 'h-8 w-9'} flex-shrink-0`}
        />
        {(open || isMobile) && (
          <span className={`${isMobile ? 'ml-2 text-xl font-semibold' : 'ml-3 pt-1 text-3xl font-bold'} text-[#FFD700] truncate`}>
            {companyName}
          </span>
        )}
      </div>
      {isMobile && (
        <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation menu" className="ml-auto p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
          <Icons.X className="h-6 w-6" />
        </button>
      )}
    </div>
  );
});