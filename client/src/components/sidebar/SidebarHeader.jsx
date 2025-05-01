import React, { memo } from 'react';
import { FiX } from 'react-icons/fi';
import Logo from '../../asset/logo.png';
import { useSidebar } from './SidebarProvider';

export const SidebarHeader = memo(({ isMobile = false }) => {
  const { open, setOpen } = useSidebar();

  return (
    <div className={`flex items-center ${isMobile ? 'h-16 px-4' : 'h-20 px-4'} border-b border-amber-100 flex-shrink-0`}>
      <div className="flex items-center align-middle overflow-hidden">
        <img src={Logo} alt="SS Gold" className={`${isMobile ? 'h-8 w-8' : 'h-8 w-9'} flex-shrink-0`} />
        {(open || isMobile) && ( // Always show title on mobile header
          <span className={`ml-${isMobile ? '2' : '3'} ${isMobile ? 'text-xl font-semibold' : 'pt-1 text-3xl font-bold'} text-amber-900 truncate`}>
            SS Gold
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