import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getApi } from '../services/api';
import DefaultAppleLogo from '../asset/apple-logo.svg';

const CompanyDetailsContext = createContext({});

export const DEFAULT_BRANDING = {
  name: 'Apple Gold',
  logo: DefaultAppleLogo,
};

const DEFAULT_COMPANY_DETAILS = {
  name: '',
  tagline: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  alternatePhone: '',
  email: '',
  website: '',
  gstin: '',
  logo: '',
};

export const CompanyDetailsProvider = ({ children }) => {
  const [companyDetails, setCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);

  useEffect(() => {
    const companyName = (companyDetails.name || '').trim() || DEFAULT_BRANDING.name;
    document.title = companyName;
  }, [companyDetails.name]);

  const updateCompanyDetails = useCallback((details) => {
    setCompanyDetails((prev) => ({ ...DEFAULT_COMPANY_DETAILS, ...prev, ...details }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCompanyDetails = async () => {
      try {
        const api = await getApi();
        const response = await api.get('/api/company-details');
        if (cancelled) return;
        setCompanyDetails((prev) => ({ ...DEFAULT_COMPANY_DETAILS, ...prev, ...response.data }));
      } catch (error) {
        console.warn('Failed to load company details from server, using local copy:', error);
        try {
          const savedDetails = window.localStorage.getItem('companyDetails');
          if (cancelled) return;
          if (savedDetails) {
            setCompanyDetails((prev) => ({
              ...DEFAULT_COMPANY_DETAILS,
              ...prev,
              ...JSON.parse(savedDetails),
            }));
          }
        } catch (localError) {
          console.error('Failed to load company details:', localError);
        }
      }
    };

    loadCompanyDetails();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ companyDetails, updateCompanyDetails }),
    [companyDetails, updateCompanyDetails]
  );

  return (
    <CompanyDetailsContext.Provider value={value}>
      {children}
    </CompanyDetailsContext.Provider>
  );
};

export const useCompanyDetails = () => useContext(CompanyDetailsContext);