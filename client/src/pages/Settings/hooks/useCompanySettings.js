import { useCallback, useEffect, useState } from "react";
import { getApi } from "../../../services/api";
import { useCompanyDetails as useCompanyDetailsContext } from "../../../context/CompanyDetailsContext";
import { DEFAULT_COMPANY_DETAILS } from "../constants";
import { fileToDataUrl, resizeImageDataUrl, MAX_LOGO_SIZE } from "../utils/imageUtils";

export const useCompanySettings = (showMessage) => {
  const { updateCompanyDetails } = useCompanyDetailsContext();
  const [companyDetails, setCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);
  const [savedCompanyDetails, setSavedCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);
  const [companySaveStatus, setCompanySaveStatus] = useState("idle");

  useEffect(() => {
    let cancelled = false;

    const loadCompanyDetails = async () => {
      try {
        const api = await getApi();
        const response = await api.get("/api/company-details");
        if (cancelled) return;
        const parsed = { ...DEFAULT_COMPANY_DETAILS, ...response.data };
        setCompanyDetails(parsed);
        setSavedCompanyDetails(parsed);
        updateCompanyDetails(parsed);
      } catch (error) {
        console.warn("Failed to load company details from server, using local copy:", error);
        try {
          const savedDetails = window.localStorage.getItem("companyDetails");
          if (cancelled) return;
          if (savedDetails) {
            const parsed = { ...DEFAULT_COMPANY_DETAILS, ...JSON.parse(savedDetails) };
            setCompanyDetails(parsed);
            setSavedCompanyDetails(parsed);
            updateCompanyDetails(parsed);
          }
        } catch (localError) {
          console.error("Failed to load company details:", localError);
        }
      }
    };

    loadCompanyDetails();

    return () => {
      cancelled = true;
    };
  }, [updateCompanyDetails]);

  const saveCompanyDetails = useCallback(async () => {
    setCompanySaveStatus("saving");
    try {
      const api = await getApi();
      const response = await api.put("/api/company-details", companyDetails);
      const parsed = { ...DEFAULT_COMPANY_DETAILS, ...response.data };
      setSavedCompanyDetails(parsed);
      setCompanyDetails(parsed);
      updateCompanyDetails(parsed);
      try {
        window.localStorage.setItem("companyDetails", JSON.stringify(parsed));
      } catch (cacheError) {
        console.warn("Failed to cache company details locally:", cacheError);
      }
      if (window.electron && typeof window.electron.cacheSplashBranding === "function") {
        try {
          await window.electron.cacheSplashBranding({
            name: parsed.name,
            tagline: parsed.tagline,
            logo: parsed.logo,
          });
        } catch (cacheError) {
          console.warn("Failed to cache splash branding:", cacheError);
        }
      }
      setCompanySaveStatus("saved");
      showMessage("success", "Company details saved successfully!");
      setTimeout(() => setCompanySaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save company details:", error);
      setCompanySaveStatus("idle");
      setTimeout(() => setCompanySaveStatus("idle"), 2000);
      showMessage("error", "Failed to save company details: " + (error.response?.data?.error || error.message));
    }
  }, [companyDetails, updateCompanyDetails, showMessage]);

  const resetCompanyDetails = useCallback(() => {
    setCompanyDetails({ ...savedCompanyDetails });
  }, [savedCompanyDetails]);

  const updateCompanyField = useCallback((key, value) => {
    setCompanyDetails((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleLogoUpload = useCallback(
    async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file);
        const resized = await resizeImageDataUrl(dataUrl, MAX_LOGO_SIZE);
        updateCompanyField("logo", resized);
      } catch (error) {
        console.error("Failed to read the logo image:", error);
        showMessage("error", "Failed to read the logo image.");
      } finally {
        event.target.value = "";
      }
    },
    [updateCompanyField, showMessage]
  );

  const removeLogo = useCallback(() => {
    updateCompanyField("logo", "");
  }, [updateCompanyField]);

  const companyDetailsDirty =
    JSON.stringify(companyDetails) !== JSON.stringify(savedCompanyDetails);

  return {
    companyDetails,
    companySaveStatus,
    companyDetailsDirty,
    saveCompanyDetails,
    resetCompanyDetails,
    updateCompanyField,
    handleLogoUpload,
    removeLogo,
  };
};
