import { useCallback, useEffect, useState } from "react";
import { isElectron } from "../utils/electron";
import {
  DEFAULT_TOKEN_SETTINGS,
  DEFAULT_SKIN_TEST_SETTINGS,
} from "../constants";
import { buildTokenTestHtml, buildSkinTestTestHtml } from "../utils/printTemplates";

export const usePrinterSettings = ({ showMessage, openPreview }) => {
  const isElectronEnv = isElectron();
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tokenSettings, setTokenSettings] = useState(DEFAULT_TOKEN_SETTINGS);
  const [skinTestSettings, setSkinTestSettings] = useState(DEFAULT_SKIN_TEST_SETTINGS);
  const [tokenSaveStatus, setTokenSaveStatus] = useState("idle");
  const [skinTestSaveStatus, setSkinTestSaveStatus] = useState("idle");

  const loadPrinters = useCallback(async () => {
    if (!isElectronEnv) return;
    setLoading(true);
    try {
      const list = await window.electron.getAvailablePrinters();
      setPrinters(list || []);
    } catch (error) {
      console.error("Failed to load printers:", error);
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  }, [isElectronEnv]);

  const loadSettings = useCallback(async () => {
    if (!isElectronEnv) return;
    try {
      const saved = await window.electron.getPrinterSettings();
      if (saved) {
        setTokenSettings({ ...DEFAULT_TOKEN_SETTINGS, ...(saved.tokenPrinter || {}) });
        setSkinTestSettings({ ...DEFAULT_SKIN_TEST_SETTINGS, ...(saved.skinTestPrinter || {}) });
      }
    } catch (error) {
      console.error("Failed to load printer settings:", error);
    }
  }, [isElectronEnv]);

  useEffect(() => {
    if (isElectronEnv) {
      loadPrinters();
      loadSettings();
    }
  }, [isElectronEnv, loadPrinters, loadSettings]);

  const saveTokenSettings = useCallback(async () => {
    if (!isElectronEnv) return;
    setTokenSaveStatus("saving");
    try {
      // Read current settings so the skin-test printer is preserved when saving token settings
      const currentSettings = await window.electron.getPrinterSettings();
      const toSave = {
        ...currentSettings,
        tokenPrinter: { ...tokenSettings },
      };
      const result = await window.electron.savePrinterSettings(toSave);
      if (result.success) {
        setTokenSettings({ ...DEFAULT_TOKEN_SETTINGS, ...(result.settings.tokenPrinter || {}) });
        setTokenSaveStatus("saved");
        showMessage("success", "Token printer settings saved successfully!");
        setTimeout(() => setTokenSaveStatus("idle"), 2000);
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      setTokenSaveStatus("idle");
      showMessage("error", "Failed to save Token settings: " + error.message);
    }
  }, [isElectronEnv, tokenSettings, showMessage]);

  const saveSkinTestSettings = useCallback(async () => {
    if (!isElectronEnv) return;
    setSkinTestSaveStatus("saving");
    try {
      // Read current settings so the token printer is preserved when saving skin-test settings
      const currentSettings = await window.electron.getPrinterSettings();
      const toSave = {
        ...currentSettings,
        skinTestPrinter: { ...skinTestSettings },
      };
      const result = await window.electron.savePrinterSettings(toSave);
      if (result.success) {
        setSkinTestSettings({ ...DEFAULT_SKIN_TEST_SETTINGS, ...(result.settings.skinTestPrinter || {}) });
        setSkinTestSaveStatus("saved");
        showMessage("success", "Skin Test printer settings saved successfully!");
        setTimeout(() => setSkinTestSaveStatus("idle"), 2000);
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      setSkinTestSaveStatus("idle");
      showMessage("error", "Failed to save Skin Test settings: " + error.message);
    }
  }, [isElectronEnv, skinTestSettings, showMessage]);

  const testTokenPrint = useCallback(() => {
    openPreview(buildTokenTestHtml(), "Token Receipt Preview");
  }, [openPreview]);

  const testSkinTestPrint = useCallback(() => {
    openPreview(buildSkinTestTestHtml(), "Skin Test Certificate Preview (A4)");
  }, [openPreview]);

  return {
    isElectronEnv,
    printers,
    loading,
    tokenSettings,
    setTokenSettings,
    skinTestSettings,
    setSkinTestSettings,
    tokenSaveStatus,
    skinTestSaveStatus,
    loadPrinters,
    saveTokenSettings,
    saveSkinTestSettings,
    testTokenPrint,
    testSkinTestPrint,
  };
};
