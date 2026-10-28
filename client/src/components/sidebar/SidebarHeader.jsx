import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSidebar } from './SidebarProvider';
import { useCompanyDetails, DEFAULT_BRANDING } from '../../context/CompanyDetailsContext';
import { Icons } from './SidebarIcons';
import { useAppearance } from '../../lib/appearance';

export const SidebarHeader = memo(({ isMobile = false }) => {
  const { open, setMobileOpen } = useSidebar();
  const { companyDetails } = useCompanyDetails();
  const { density } = useAppearance();
  const companyName = (companyDetails?.name || '').trim() || DEFAULT_BRANDING.name;
  const companyLogo = companyDetails?.logo || DEFAULT_BRANDING.logo;
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const [fontSize, setFontSize] = useState(isMobile ? 20 : 24);

  const maxFontSize = useMemo(() => (isMobile ? 22 : 28), [isMobile]);
  const minFontSize = useMemo(() => (isMobile ? 16 : 18), [isMobile]);

  const adjust = useCallback(() => {
    if (!open && !isMobile) {
      setFontSize(maxFontSize);
      return;
    }
    const textEl = textRef.current;
    const containerEl = containerRef.current;
    const logoEl = logoRef.current;
    if (!textEl || !containerEl) return;

    const basePadding = isMobile ? 32 : 32;
    const logoHeight = logoEl?.offsetHeight || (isMobile ? 32 : 36);
    const logoWidth = logoEl?.offsetWidth || logoHeight;
    const gap = isMobile ? 8 : 12;
    const available = containerEl.clientWidth - logoWidth - gap - 4;

    if (available <= 0) {
      setFontSize(Math.min(logoHeight - 2, maxFontSize));
      return;
    }

    textEl.style.whiteSpace = 'nowrap';
    textEl.style.overflow = 'visible';
    textEl.style.textOverflow = 'clip';

    // Try to match logo height first
    let targetSize = Math.min(logoHeight, maxFontSize);
    textEl.style.fontSize = `${targetSize}px`;
    let width = textEl.scrollWidth;

    // If it fits at logo height, use it (or slightly less if needed)
    if (width <= available) {
      setFontSize(targetSize);
      return;
    }

    // If it doesn't fit at logo height, scale down from logo height
    let size = targetSize;
    while (width > available && size > minFontSize) {
      size -= 0.5;
      textEl.style.fontSize = `${size}px`;
      width = textEl.scrollWidth;
    }

    // If still doesn't fit at min, try to nudge sidebar wider if possible (desktop expanded)
    if (width > available && !isMobile && open) {
      const sidebarEl = containerEl.closest('[data-sidebar-desktop]') || containerEl.closest('.md\\:flex');
      if (sidebarEl) {
        const current = parseInt(getComputedStyle(sidebarEl).width, 10) || density.sidebarWidth || 260;
        const needed = logoWidth + gap + width + basePadding + 16;
        if (needed > current && needed <= 420) {
          sidebarEl.style.width = `${needed}px`;
          sidebarEl.style.minWidth = `${needed}px`;
          const newAvailable = containerEl.clientWidth - logoWidth - gap - 4;
          if (newAvailable > available) {
            let s2 = size;
            textEl.style.fontSize = `${s2}px`;
            let w2 = textEl.scrollWidth;
            while (w2 > newAvailable && s2 > minFontSize) {
              s2 -= 0.5;
              textEl.style.fontSize = `${s2}px`;
              w2 = textEl.scrollWidth;
            }
            size = s2;
          }
        }
      }
    }

    setFontSize(size);
  }, [companyName, open, isMobile, maxFontSize, minFontSize, density.sidebarWidth]);

  useEffect(() => {
    adjust();
    const ro = new ResizeObserver(adjust);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', adjust);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', adjust);
    };
  }, [adjust]);

  useEffect(() => {
    // Reset any inline width override when collapsing
    if (!open && !isMobile) {
      const el = containerRef.current?.closest('[data-sidebar-desktop]');
      if (el) {
        el.style.width = '';
        el.style.minWidth = '';
      }
    }
  }, [open, isMobile]);

  return (
    <div className={`flex items-center ${isMobile ? 'h-16 px-4' : 'h-20 px-4'} border-b border-white/10 flex-shrink-0`}>
      <div ref={containerRef} className="flex items-center align-middle overflow-hidden min-w-0 flex-1">
        <img
          ref={logoRef}
          src={companyLogo}
          alt={companyName}
          className={`${isMobile ? 'h-8 w-8' : 'h-8 w-9'} flex-shrink-0`}
        />
        {(open || isMobile) && (
          <span
            ref={textRef}
            className={`${isMobile ? 'ml-2 font-semibold' : 'ml-3 pt-1 font-bold'} text-[#FFD700]`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.15, letterSpacing: '-0.01em' }}
            title={companyName}
          >
            {companyName}
          </span>
        )}
      </div>

      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="ml-auto p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors motion-reduce:transition-none"
        >
          <Icons.X className="h-6 w-6" />
        </button>
      )}
    </div>
  );
});
