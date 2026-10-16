import { useCallback, useEffect, useMemo, useState } from "react";
import PreviewModal from "../../components/common/PreviewModal";
import UserManagement from "../../components/UserInterface/UserManagement";
import { useUser } from "../../components/UserInterface/UserContext";
import { SETTINGS_TABS } from "./constants";
import { useCompanySettings } from "./hooks/useCompanySettings";
import { useNotifications } from "./hooks/useNotifications";
import { usePreferences } from "./hooks/usePreferences";
import { MENU_DEFINITIONS, filterByPermission } from "../../utils/permissions";
import { usePrinterSettings } from "./hooks/usePrinterSettings";
import AboutPanel from "./components/AboutPanel";
import CompanySettingsPanel from "./components/CompanySettingsPanel";
import GlobalMessage from "./components/GlobalMessage";
import PreferencesPanel from "./components/PreferencesPanel";
import PrinterSettingsPanel from "./components/PrinterSettingsPanel";
import SettingsTabs from "./components/SettingsTabs";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [previewModal, setPreviewModal] = useState({ isOpen: false, htmlContent: "", title: "" });

  const { isAdmin, user } = useUser();

  const { globalMessage, showMessage, clearMessage } = useNotifications();
  const { preferences, updatePreference, savedKey } = usePreferences(showMessage);
  const company = useCompanySettings(showMessage);

  // Pages the signed in account is allowed to open, offered as landing choices.
  const landingOptions = useMemo(
    () =>
      filterByPermission(user, MENU_DEFINITIONS)
        .filter((item) => item.path)
        .map((item) => ({ value: item.path, label: item.label })),
    [user]
  );

  const openPreview = useCallback((htmlContent, title) => {
    setPreviewModal({ isOpen: true, htmlContent, title });
  }, []);
  const closePreview = useCallback(() => {
    setPreviewModal({ isOpen: false, htmlContent: "", title: "" });
  }, []);

  const printer = usePrinterSettings({ showMessage, openPreview });

  // The server rejects user management for non-admins, so hide the tab rather
  // than showing an empty panel with an error
  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin]
  );

  // Never leave a non-admin sitting on a tab they cannot see
  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "company");
    }
  }, [visibleTabs, activeTab]);

  return (
    <div className="container mx-auto px-4 py-6">
      <GlobalMessage message={globalMessage} onClose={clearMessage} />

      <SettingsTabs tabs={visibleTabs} activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "company" && (
        <CompanySettingsPanel
          companyDetails={company.companyDetails}
          onChangeField={company.updateCompanyField}
          onLogoUpload={company.handleLogoUpload}
          onRemoveLogo={company.removeLogo}
          onReset={company.resetCompanyDetails}
          onSave={company.saveCompanyDetails}
          saveStatus={company.companySaveStatus}
          dirty={company.companyDetailsDirty}
        />
      )}

      {activeTab === "printer" && (
        <PrinterSettingsPanel
          tokenSettings={printer.tokenSettings}
          onTokenSettingsChange={printer.setTokenSettings}
          skinTestSettings={printer.skinTestSettings}
          onSkinTestSettingsChange={printer.setSkinTestSettings}
          printers={printer.printers}
          loading={printer.loading}
          onRefreshPrinters={printer.loadPrinters}
          onSaveTokenSettings={printer.saveTokenSettings}
          onSaveSkinTestSettings={printer.saveSkinTestSettings}
          onTestTokenPrint={printer.testTokenPrint}
          onTestSkinTestPrint={printer.testSkinTestPrint}
          tokenSaveStatus={printer.tokenSaveStatus}
          skinTestSaveStatus={printer.skinTestSaveStatus}
          isElectronEnv={printer.isElectronEnv}
        />
      )}

      {activeTab === "preferences" && (
        <PreferencesPanel
          preferences={preferences}
          onChange={updatePreference}
          savedKey={savedKey}
          landingOptions={landingOptions}
        />
      )}

      {activeTab === "users" && isAdmin && (
        <div id="users-settings-panel" role="tabpanel">
          <UserManagement />
        </div>
      )}

      {activeTab === "about" && <AboutPanel />}

      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreview}
        htmlContent={previewModal.htmlContent}
        title={previewModal.title}
      />
    </div>
  );
};

export default Settings;
