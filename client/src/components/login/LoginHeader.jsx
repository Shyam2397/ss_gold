import React, { useCallback, useEffect, useRef } from 'react';
import { useCompanyDetails, DEFAULT_BRANDING } from '../../context/CompanyDetailsContext';

const MIN_FONT = 16;

const maxFontForViewport = () => {
  if (typeof window === 'undefined') return 60;
  return window.matchMedia('(min-width: 640px)').matches ? 60 : 36;
};

const LoginHeader = () => {
  const { companyDetails } = useCompanyDetails();
  const companyName = (companyDetails?.name || '').trim() || DEFAULT_BRANDING.name;
  const companyLogo = companyDetails?.logo || DEFAULT_BRANDING.logo;

  const containerRef = useRef(null);
  const textRef = useRef(null);

  const fitText = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const available = node.clientWidth;
    const max = maxFontForViewport();
    if (!available) {
      node.style.fontSize = `${max}px`;
      return;
    }

    node.style.fontSize = `${max}px`;
    node.style.whiteSpace = 'nowrap';
    const natural = node.scrollWidth;
    node.style.whiteSpace = '';

    const size =
      natural > available && natural > 0
        ? Math.max(MIN_FONT, Math.floor((max * available) / natural))
        : max;
    node.style.fontSize = `${size}px`;
  }, []);

  useEffect(() => {
    fitText();
  }, [fitText, companyName]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fitText);
      return () => window.removeEventListener('resize', fitText);
    }
    const observer = new ResizeObserver(() => fitText());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitText]);

  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => fitText());
    }
  }, [fitText]);

  return (
    <div className="flex flex-col items-center pt-2">
      <img
        src={companyLogo}
        alt={companyName}
        className="h-20 w-auto transition-transform hover:scale-105"
      />
      <div ref={containerRef} className="w-full text-center mt-3">
        <h1
          ref={textRef}
          className="text-4xl sm:text-6xl font-bold leading-tight break-words bg-[linear-gradient(to_right,#C69A32_0%,#FFD700_25%,#FFD700_75%,#C69A32_100%)] bg-clip-text text-transparent"
        >
          {companyName}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Sign in to continue
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;
