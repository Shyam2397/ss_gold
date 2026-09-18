import React, { useState, useEffect, useCallback } from "react";
import {
  FiPrinter,
  FiSave,
  FiRefreshCw,
  FiSettings,
  FiFileText,
  FiMonitor,
  FiCopy,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import PreviewModal from "../components/common/PreviewModal";

const isElectron = () => {
  return window.electron && window.electron.isElectron;
};

const PAPER_SIZES_TOKEN = [
  { value: "80mm", label: "80mm Thermal (Receipt)" },
  { value: "58mm", label: "58mm Thermal (Receipt)" },
];

const PAPER_SIZES_A4 = [
  { value: "A4", label: "A4 (210 × 297 mm)" },
  { value: "A5", label: "A5 (148 × 210 mm)" },
  { value: "Letter", label: "Letter (8.5 × 11 in)" },
  { value: "Legal", label: "Legal (8.5 × 14 in)" },
];

const ORIENTATIONS = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const COLOR_OPTIONS = [
  { value: "monochrome", label: "Monochrome (Black & White)" },
  { value: "color", label: "Color" },
];

const PAPER_TYPES = [
  { value: "", label: "Auto / Default" },
  { value: "plain", label: "Plain paper" },
  { value: "epson-photo-quality-ink-jet", label: "Epson Photo Quality Ink Jet" },
  { value: "epson-matte", label: "Epson Matte" },
  { value: "epson-ultra-glossy", label: "Epson Ultra Glossy" },
  { value: "epson-premium-glossy", label: "Epson Premium Glossy" },
  { value: "epson-premium-semigloss", label: "Epson Premium Semigloss" },
  { value: "photo-paper-glossy", label: "Photo Paper Glossy" },
  { value: "envelope", label: "Envelope" },
];

const DEFAULT_TOKEN_SETTINGS = {
  printerName: "",
  documentSize: "80mm",
  orientation: "portrait",
  paperType: "thermal",
  quality: "high",
  color: "monochrome",
  copies: 1,
  silentMode: true,
};

const DEFAULT_SKIN_TEST_SETTINGS = {
  printerName: "",
  documentSize: "A4",
  orientation: "portrait",
  paperType: "plain",
  quality: "high",
  color: "color",
  copies: 1,
  silentMode: true,
};

const SelectField = ({ label, icon: Icon, value, onChange, options, disabled, description }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
      {Icon && <Icon className="w-4 h-4 mr-1.5 text-amber-600" />}
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm disabled:bg-amber-50 disabled:text-amber-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {description && (
      <p className="text-xs text-amber-600 mt-1">{description}</p>
    )}
  </div>
);

const NumberField = ({ label, icon: Icon, value, onChange, min = 1, max = 99 }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
      {Icon && <Icon className="w-4 h-4 mr-1.5 text-amber-600" />}
      {label}
    </label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 1)))}
      className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm"
    />
  </div>
);

const ToggleField = ({ label, icon: Icon, value, onChange, description }) => (
  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
    <div className="flex items-start">
      {Icon && <Icon className="w-5 h-5 mr-2 mt-0.5 text-amber-600" />}
      <div>
        <p className="text-sm font-medium text-amber-900">{label}</p>
        {description && <p className="text-xs text-amber-600 mt-0.5">{description}</p>}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
        value ? "bg-amber-600" : "bg-amber-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const PrinterCard = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  settings,
  onChange,
  printers,
  paperSizes,
  loading,
  onRefreshPrinters,
  onSave,
  onTestPrint,
  saveStatus,
  isElectronEnv,
}) => {
  const updateField = (key, value) => {
    const updated = { ...settings, [key]: value };
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
      <div className={`p-4 bg-gradient-to-r ${iconColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white">
            <Icon className="w-6 h-6 mr-3" />
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm opacity-90">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onRefreshPrinters}
            disabled={!isElectronEnv || loading}
            className="flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {!isElectronEnv && (
          <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Printer settings require the Electron application. Some features are disabled in browser mode.
            </p>
          </div>
        )}

        <div>
          <label className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
            <FiPrinter className="w-4 h-4 mr-1.5 text-amber-600" />
            Select Printer
          </label>
          <select
            value={settings.printerName}
            onChange={(e) => updateField("printerName", e.target.value)}
            disabled={!isElectronEnv || printers.length === 0}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm disabled:bg-amber-50 disabled:text-amber-500"
          >
            <option value="">-- System Default Printer --</option>
            {printers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName || p.name}
                {p.isDefault ? " (Default)" : ""}
              </option>
            ))}
          </select>
          {isElectronEnv && printers.length === 0 && !loading && (
            <p className="text-xs text-amber-600 mt-1">
              No printers detected. Click "Refresh" to reload.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Paper Size"
            icon={FiFileText}
            value={settings.documentSize}
            onChange={(v) => updateField("documentSize", v)}
            options={paperSizes}
          />
          <SelectField
            label="Orientation"
            icon={FiMonitor}
            value={settings.orientation}
            onChange={(v) => updateField("orientation", v)}
            options={ORIENTATIONS}
          />
          <SelectField
            label="Paper Type"
            icon={FiFileText}
            value={settings.paperType}
            onChange={(v) => updateField("paperType", v)}
            options={PAPER_TYPES}
            description="Selects the physical media type at driver level (Plain / Photo / Glossy / Labels etc.) via Windows DEVMODE before printing."
          />
          <SelectField
            label="Color Mode"
            icon={FiSettings}
            value={settings.color}
            onChange={(v) => updateField("color", v)}
            options={COLOR_OPTIONS}
          />
          <NumberField
            label="Number of Copies"
            icon={FiCopy}
            value={settings.copies}
            onChange={(v) => updateField("copies", v)}
            min={1}
            max={50}
          />
        </div>

        <ToggleField
          label="Silent Print Mode"
          icon={FiPrinter}
          value={settings.silentMode}
          onChange={(v) => updateField("silentMode", v)}
          description="Print directly without showing the system print dialog."
        />

        <div className="flex items-center justify-between pt-3 border-t border-amber-100">
          <button
            onClick={onTestPrint}
            disabled={!isElectronEnv}
            className="flex items-center px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiEye className="w-4 h-4 mr-1.5" />
            Test Preview
          </button>
          <button
            onClick={onSave}
            disabled={!isElectronEnv}
            className={`flex items-center px-4 py-2 rounded-lg text-white transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              saveStatus === "saving"
                ? "bg-amber-400 cursor-wait"
                : saveStatus === "saved"
                ? "bg-green-600"
                : "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <FiRefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : saveStatus === "saved" ? (
              <>
                <FiCheckCircle className="w-4 h-4 mr-1.5" />
                Saved!
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4 mr-1.5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tokenSettings, setTokenSettings] = useState(DEFAULT_TOKEN_SETTINGS);
  const [skinTestSettings, setSkinTestSettings] = useState(DEFAULT_SKIN_TEST_SETTINGS);
  const [tokenSaveStatus, setTokenSaveStatus] = useState("idle");
  const [skinTestSaveStatus, setSkinTestSaveStatus] = useState("idle");
  const [globalMessage, setGlobalMessage] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, htmlContent: "", title: "" });

  const isElectronEnv = isElectron();

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

  const showMessage = (type, text) => {
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 4000);
  };

  const saveTokenSettings = async () => {
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
  };

  const saveSkinTestSettings = async () => {
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
  };

  const testTokenPrint = () => {
    const testHtml = `
        <html><head><style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 8px; font-size: 12px; }
          .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
          .header h1 { font-size: 18px; margin: 0; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          .footer { text-align: center; margin-top: 4px; font-style: italic; }
        </style></head><body>
          <div class="header"><h1>SS GOLD</h1><p>Test Token Receipt</p></div>
          <div class="row"><span>Token No</span><span>T001</span></div>
          <div class="row"><span>Name</span><span>Test Customer</span></div>
          <div class="row"><span>Test</span><span>Skin Testing</span></div>
          <div class="row"><span>Weight</span><span>10.000 g</span></div>
          <div class="row"><span>Sample</span><span>Ring</span></div>
          <div class="row"><span>Amount</span><span>₹100</span></div>
          <div class="footer">--- Test Print Successful ---</div>
        </body></html>`;
    setPreviewModal({ isOpen: true, htmlContent: testHtml, title: "Token Receipt Preview" });
  };

  const testSkinTestPrint = () => {
    const testHtml = `
      <html><head><style>
        @page { size: A4 portrait; margin: 0; }
        body { font-family: Arial, sans-serif; width: 210mm; padding: 10mm; box-sizing: border-box; font-size: 11pt; color: #111; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FFD700; padding-bottom: 6px; margin-bottom: 8px; }
        .logo { font-size: 28pt; font-weight: bold; color: #c09823; }
        .company { text-align: right; font-size: 9pt; color: #333; }
        .bar { background: #32CD32; color: yellow; font-size: 13pt; font-weight: bold; display: flex; justify-content: space-around; padding: 6px 0; border-radius: 3px; margin: 8px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 9.5pt; margin-bottom: 8px; }
        .footer { text-align: center; font-style: italic; margin-top: 8px; border-top: 2px solid #FFD700; padding-top: 4px; color: #555; }
      </style></head><body>
        <div class="header">
          <div class="logo">SS GOLD</div>
          <div class="company"><strong style="color:#e00;font-size:13pt">Computer X-ray Testing</strong><br/>59, Main Bazaar, Nilakottai - 624 208<br/>Ph.No : 8903225544</div>
        </div>
        <div class="grid">
          <div><b>Token No</b> : T001</div><div><b>Date</b> : 01/01/2025</div>
          <div><b>Name</b> : Test Customer</div><div><b>Time</b> : 10:00 AM</div>
          <div><b>Sample</b> : Ring</div><div><b>Weight</b> : 10.000 g</div>
        </div>
        <div class="bar">
          <span>GOLD FINENESS %</span><span>91.60 %</span>
          <span>KARAT Ct</span><span>21.98 K</span>
        </div>
        <div class="grid">
          <div>Gold : -</div><div>Nickel : -</div>
          <div>Copper : 5.20</div><div>Silver : 2.80</div>
          <div>Zinc : 0.40</div><div>Others : -</div>
        </div>
        <div class="footer">Thank You .... Visit Again....</div>
      </body></html>`;
    setPreviewModal({ isOpen: true, htmlContent: testHtml, title: "Skin Test Certificate Preview (A4)" });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center mb-2 justify-between">
          <div>
            <div className="flex items-center">
              <FiSettings className="w-8 h-8 text-amber-600 mr-3" />
              <h1 className="text-2xl font-bold text-amber-900">Printer Settings</h1>
            </div>
            <p className="text-amber-600 text-sm">
              Configure the Token / Receipt thermal printer profile.
            </p>
          </div>
          {globalMessage && (
            <div
              className={`p-3 rounded-xl flex items-center ${
                globalMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {globalMessage.type === "success" ? (
                <FiCheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <p className="text-sm">{globalMessage.text}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">
        <PrinterCard
          title="Token / Receipt Printer"
          subtitle="Thermal 80mm / 58mm printer"
          icon={FiPrinter}
          iconColor="from-amber-600 to-yellow-500"
          settings={tokenSettings}
          onChange={setTokenSettings}
          printers={printers}
          paperSizes={PAPER_SIZES_TOKEN}
          loading={loading}
          onRefreshPrinters={loadPrinters}
          onSave={saveTokenSettings}
          onTestPrint={testTokenPrint}
          saveStatus={tokenSaveStatus}
          isElectronEnv={isElectronEnv}
        />

        <PrinterCard
          title="Skin Test Certificate Printer"
          subtitle="A4 colour printer for skin-test certificates"
          icon={FiPrinter}
          iconColor="from-yellow-600 to-amber-400"
          settings={skinTestSettings}
          onChange={setSkinTestSettings}
          printers={printers}
          paperSizes={PAPER_SIZES_A4}
          loading={loading}
          onRefreshPrinters={loadPrinters}
          onSave={saveSkinTestSettings}
          onTestPrint={testSkinTestPrint}
          saveStatus={skinTestSaveStatus}
          isElectronEnv={isElectronEnv}
        />
      </div>

      <div className="mt-6 max-w-5xl bg-white rounded-xl shadow-sm border border-amber-100 p-5">
        <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2 text-amber-600" />
          Notes & Information
        </h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            Settings are saved permanently and will persist across application restarts.
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            Silent Mode bypasses the system print dialog and sends the job directly to the selected printer.
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            If no printer is selected, the system's default printer will be used automatically.
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            Use "Test Preview" to see how the receipt will appear before printing.
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            The Skin Test Certificate printer is used for A4 colour prints from the Skin Testing page. It is saved independently from the Token printer.
          </li>
        </ul>
      </div>

      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, htmlContent: "", title: "" })}
        htmlContent={previewModal.htmlContent}
        title={previewModal.title}
      />
    </div>
  );
};

export default Settings;
