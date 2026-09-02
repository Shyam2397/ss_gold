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
  FiDownload
} from "react-icons/fi";

const isElectron = () => {
  return window.electron && window.electron.isElectron;
};

const PAPER_SIZES_TOKEN = [
  { value: "80mm", label: "80mm Thermal (Receipt)" },
  { value: "58mm", label: "58mm Thermal (Receipt)" },
];

const PAPER_SIZES_SKINTEST = [
  { value: "A4", label: "A4 (210 x 297 mm)" },
  { value: "A5", label: "A5 (148 x 210 mm)" },
  { value: "Letter", label: "Letter (8.5 x 11 in)" },
  { value: "Legal", label: "Legal (8.5 x 14 in)" },
];

const ORIENTATIONS = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const QUALITY_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Draft Vivid", label: "Draft Vivid" },
  { value: "Standard", label: "Standard" },
  { value: "Standard Vivid", label: "Standard Vivid" },
  { value: "High", label: "High" },
];

const normalizeQualityValue = (value = "") => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, " ")
    .replace(/\s+/g, " ");
};

const getQualityOptionsForPrinter = (printerName = "", printers = []) => {
  const normalizedName = (printerName || "").toLowerCase();

  const selectedPrinter = printers.find((printer) => {
    const candidateNames = [printer?.name, printer?.displayName].filter(Boolean).map((value) => value.toLowerCase());
    return candidateNames.includes(normalizedName) || candidateNames.some((value) => value.includes(normalizedName));
  });

  const supportedQualityValues = [];
  const printerOptions = selectedPrinter?.options || {};
  const qualityCandidates = [
    printerOptions.quality,
    printerOptions.printQuality,
    printerOptions.printerQuality,
    printerOptions.qualityMode,
    printerOptions.qualityOptions,
  ];

  qualityCandidates.forEach((candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach((value) => supportedQualityValues.push(String(value)));
      return;
    }

    if (candidate && typeof candidate === "object") {
      Object.values(candidate).forEach((value) => supportedQualityValues.push(String(value)));
      return;
    }

    if (typeof candidate === "string") {
      supportedQualityValues.push(candidate);
    }
  });

  if (supportedQualityValues.length > 0) {
    const filtered = QUALITY_OPTIONS.filter((option) =>
      supportedQualityValues.some((value) => normalizeQualityValue(value) === normalizeQualityValue(option.value))
    );

    if (filtered.length > 0) {
      return filtered;
    }
  }

  if (normalizedName.includes("l3210")) {
    return [
      { value: "Draft", label: "Draft" },
      { value: "Draft Vivid", label: "Draft Vivid" },
      { value: "Standard", label: "Standard" },
      { value: "Standard Vivid", label: "Standard Vivid" },
      { value: "High", label: "High" },
    ];
  }

  if (normalizedName.includes("l8050")) {
    return [
      { value: "Draft", label: "Draft" },
      { value: "Standard", label: "Standard" },
      { value: "High", label: "High" },
    ];
  }

  return QUALITY_OPTIONS;
};

const COLOR_OPTIONS = [
  { value: "monochrome", label: "Monochrome (Black & White)" },
  { value: "color", label: "Color" },
];

const PAPER_SOURCES = [
  { value: "", label: "Auto / Default" },
  { value: "upper", label: "Upper Tray" },
  { value: "lower", label: "Lower Tray" },
  { value: "manual", label: "Manual Feed" },
  { value: "multi", label: "Multi-Purpose Tray" },
];

const PAPER_TYPES = [
  { value: "", label: "Auto / Default" },
  { value: "plain", label: "Plain Paper" },
  { value: "thin", label: "Thin Paper" },
  { value: "thick", label: "Thick Paper" },
  { value: "glossy", label: "Glossy Paper" },
  { value: "transparency", label: "Transparency" },
  { value: "labels", label: "Labels" },
  { value: "envelope", label: "Envelope" },
  { value: "cardstock", label: "Cardstock" },
  { value: "thermal", label: "Thermal Paper" },
];

const DEFAULT_TOKEN_SETTINGS = {
  printerName: "",
  paperSource: "",
  documentSize: "80mm",
  orientation: "portrait",
  paperType: "thermal",
  quality: "high",
  color: "monochrome",
  copies: 1,
  silentMode: true,
};

const DEFAULT_SKINTEST_SETTINGS = {
  printerName: "",
  paperSource: "",
  documentSize: "A4",
  orientation: "portrait",
  paperType: "plain",
  quality: "high",
  color: "color",
  copies: 1,
  silentMode: true,
};

const SelectField = ({ label, icon: Icon, value, onChange, options, disabled }) => (
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
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const qualityOptions = getQualityOptionsForPrinter(settings.printerName, printers);
  const selectedQuality = qualityOptions.some((option) => option.value === settings.quality)
    ? settings.quality
    : qualityOptions[0]?.value || "standard";

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
            label="Paper Source"
            icon={FiDownload}
            value={settings.paperSource}
            onChange={(v) => updateField("paperSource", v)}
            options={PAPER_SOURCES}
          />
          <SelectField
            label="Paper Type"
            icon={FiFileText}
            value={settings.paperType}
            onChange={(v) => updateField("paperType", v)}
            options={PAPER_TYPES}
          />
          <SelectField
            label="Print Quality"
            icon={FiSettings}
            value={selectedQuality}
            onChange={(v) => updateField("quality", v)}
            options={qualityOptions}
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
  const [skinTestSettings, setSkinTestSettings] = useState(DEFAULT_SKINTEST_SETTINGS);
  const [tokenSaveStatus, setTokenSaveStatus] = useState("idle");
  const [skinTestSaveStatus, setSkinTestSaveStatus] = useState("idle");
  const [globalMessage, setGlobalMessage] = useState(null);

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
        setSkinTestSettings({ ...DEFAULT_SKINTEST_SETTINGS, ...(saved.skinTestPrinter || {}) });
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
      const currentSettings = await window.electron.getPrinterSettings();
      const toSave = {
        ...currentSettings,
        skinTestPrinter: { ...skinTestSettings },
      };
      const result = await window.electron.savePrinterSettings(toSave);
      if (result.success) {
        setSkinTestSettings({ ...DEFAULT_SKINTEST_SETTINGS, ...(result.settings.skinTestPrinter || {}) });
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

  const testTokenPrint = async () => {
    if (!isElectronEnv) return;
    try {
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
      await window.electron.testPrint("token", testHtml);
      showMessage("success", "Token test preview opened!");
    } catch (error) {
      showMessage("error", "Test preview failed: " + error.message);
    }
  };

  const testSkinTestPrint = async () => {
    if (!isElectronEnv) return;
    try {
      const testHtml = `
        <html><head><style>
          @page { size: A4 portrait; margin: 0; }
          body { font-family: Arial, sans-serif; width: 210mm; margin: 0; padding: 10mm; box-sizing: border-box; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid gold; padding-bottom: 8px; }
          .header h1 { color: #D6A406; font-size: 24pt; margin: 0; }
          .info { padding: 10px 0; }
          .bar { background: #32CD32; color: yellow; padding: 8px; text-align: center; font-weight: bold; margin: 10px 0; }
          .row { display: flex; margin: 4px 0; }
          .row span:first-child { font-weight: bold; width: 160px; }
          .footer { text-align: center; margin-top: 15px; font-style: italic; font-size: 14pt; }
        </style></head><body>
          <div class="header">
            <h1>SS GOLD</h1>
            <div><p style="color:red;margin:0;font-weight:bold;">Computer X-ray Testing</p><p style="margin:0;">59, Main Bazaar, Nilakottai</p></div>
          </div>
          <div class="info">
            <div class="row"><span>Token No</span><span>: T001</span></div>
            <div class="row"><span>Name</span><span>: Test Customer</span></div>
            <div class="row"><span>Sample</span><span>: Ring</span></div>
            <div class="row"><span>Weight</span><span>: 10.000 g</span></div>
          </div>
          <div class="bar">GOLD FINENESS % : 91.60 % &nbsp;&nbsp;|&nbsp;&nbsp; KARAT Ct : 22.00 K</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0;">
            <div>Silver : 8.00</div><div>Nickel : 0.20</div><div>Copper : 0.10</div><div>Zinc : 0.10</div>
          </div>
          <div class="footer">--- Test Print Successful - Visit Again ---</div>
        </body></html>`;
      await window.electron.testPrint("skinTest", testHtml);
      showMessage("success", "Skin Test preview opened!");
    } catch (error) {
      showMessage("error", "Test preview failed: " + error.message);
    }
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
              Configure separate printer profiles for Token receipts (thermal) and Skin Test certificates (A4).
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

      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          subtitle="A4 normal printer"
          icon={FiFileText}
          iconColor="from-green-600 to-emerald-500"
          settings={skinTestSettings}
          onChange={setSkinTestSettings}
          printers={printers}
          paperSizes={PAPER_SIZES_SKINTEST}
          loading={loading}
          onRefreshPrinters={loadPrinters}
          onSave={saveSkinTestSettings}
          onTestPrint={testSkinTestPrint}
          saveStatus={skinTestSaveStatus}
          isElectronEnv={isElectronEnv}
        />
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-amber-100 p-5">
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
            Use "Test Preview" to verify your configuration before saving.
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            Paper Source and Paper Type availability depend on your specific printer model.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
