import { useState, useEffect, useCallback } from "react";
import {
  FiHome,
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
  FiInfo,
  FiSliders,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiHash,
  FiRotateCcw,
  FiImage,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";
import PreviewModal from "../../components/common/PreviewModal";
import { getApi } from "../../services/api";
import { useCompanyDetails } from "../../context/CompanyDetailsContext";

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

const DEFAULT_COMPANY_DETAILS = {
  name: "",
  tagline: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  alternatePhone: "",
  email: "",
  website: "",
  gstin: "",
  logo: "",
};

const COMPANY_FIELDS = [
  { key: "name", label: "Company name", placeholder: "SS GOLD", icon: FiHome, type: "text" },
  { key: "tagline", label: "Tagline", placeholder: "Computer X-ray Testing", icon: FiInfo, type: "text" },
  { key: "gstin", label: "GSTIN / Tax ID", placeholder: "33AABCS1234F1Z5", icon: FiHash, type: "text" },
  { key: "phone", label: "Phone number", placeholder: "8903225544", icon: FiPhone, type: "tel" },
  { key: "alternatePhone", label: "Alternate phone", placeholder: "Optional", icon: FiPhone, type: "tel" },
  { key: "email", label: "Email address", placeholder: "company@example.com", icon: FiMail, type: "email" },
  { key: "website", label: "Website", placeholder: "www.ssgold.in", icon: FiGlobe, type: "text" },
];

const SETTINGS_TABS = [
  { id: "company", label: "Company", description: "Business details", icon: FiHome },
  { id: "printer", label: "Printer", description: "Print profiles", icon: FiPrinter },
  { id: "preferences", label: "Preferences", description: "App behaviour", icon: FiSliders },
  { id: "about", label: "About", description: "Info & notes", icon: FiInfo },
];

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
      className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm disabled:bg-amber-50 disabled:text-amber-500"
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
      className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm"
    />
  </div>
);

const TextField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", id, disabled }) => (
  <div>
    <label htmlFor={id} className="flex items-center text-sm font-medium text-amber-900 mb-1.5">
      {Icon && <Icon className="w-4 h-4 mr-1.5 text-amber-600" />}
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm disabled:bg-amber-50 disabled:text-amber-500"
    />
  </div>
);

const ToggleField = ({ label, icon: Icon, value, onChange, description }) => (
  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100">
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

const MAX_LOGO_SIZE = 400;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const resizeImageDataUrl = (dataUrl, maxSize) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

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
      <div className={`p-3 bg-gradient-to-r ${iconColor}`}>
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

      <div className="p-4 space-y-3">
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
            className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm disabled:bg-amber-50 disabled:text-amber-500"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
          <NumberField
            label="Number of Copies"
            icon={FiCopy}
            value={settings.copies}
            onChange={(v) => updateField("copies", v)}
            min={1}
            max={50}
          />
          <SelectField
            label="Paper Type"
            icon={FiFileText}
            value={settings.paperType}
            onChange={(v) => updateField("paperType", v)}
            options={PAPER_TYPES}
            description="Sets the physical media type at driver level (DEVMODE)."
          />
          <SelectField
            label="Color Mode"
            icon={FiSettings}
            value={settings.color}
            onChange={(v) => updateField("color", v)}
            options={COLOR_OPTIONS}
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
  const [activeTab, setActiveTab] = useState("company");
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tokenSettings, setTokenSettings] = useState(DEFAULT_TOKEN_SETTINGS);
  const [skinTestSettings, setSkinTestSettings] = useState(DEFAULT_SKIN_TEST_SETTINGS);
  const [tokenSaveStatus, setTokenSaveStatus] = useState("idle");
  const [skinTestSaveStatus, setSkinTestSaveStatus] = useState("idle");
  const [globalMessage, setGlobalMessage] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, htmlContent: "", title: "" });
  const [companyDetails, setCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);
  const [savedCompanyDetails, setSavedCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);
  const [companySaveStatus, setCompanySaveStatus] = useState("idle");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(true);
  const [printValuesOnly, setPrintValuesOnly] = useState(false);
  const [printValuesOnlySaved, setPrintValuesOnlySaved] = useState(false);

  const isElectronEnv = isElectron();
  const { updateCompanyDetails } = useCompanyDetails();

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

    const savedConfirmationPreference = window.localStorage.getItem("showSaveConfirmation");
    if (savedConfirmationPreference !== null) {
      setShowSaveConfirmation(savedConfirmationPreference === "true");
    }
    const savedPrintValuesOnly = window.localStorage.getItem("skinTest_printValuesOnly");
    if (savedPrintValuesOnly !== null) {
      setPrintValuesOnly(savedPrintValuesOnly === "true");
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const showMessage = (type, text) => {
    if (type === "success" && !showSaveConfirmation) return;
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 4000);
  };

  const saveCompanyDetails = async () => {
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
  };

  const resetCompanyDetails = () => {
    setCompanyDetails({ ...savedCompanyDetails });
  };

  const updateCompanyField = (key, value) => {
    setCompanyDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event) => {
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
  };

  const removeLogo = () => {
    updateCompanyField("logo", "");
  };

  const companyDetailsDirty =
    JSON.stringify(companyDetails) !== JSON.stringify(savedCompanyDetails);

  const updateSaveConfirmation = (value) => {
    setShowSaveConfirmation(value);
    window.localStorage.setItem("showSaveConfirmation", String(value));
  };

  const updatePrintValuesOnly = (value) => {
    setPrintValuesOnly(value);
    try {
      window.localStorage.setItem("skinTest_printValuesOnly", String(value));
      setPrintValuesOnlySaved(true);
      showMessage("success", "Skin Test print preference saved!");
      setTimeout(() => setPrintValuesOnlySaved(false), 2000);
    } catch (error) {
      showMessage("error", "Failed to save print preference: " + error.message);
    }
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
      {globalMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slideIn">
          <div
            className={`flex items-center rounded-xl p-3 shadow-lg ${
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
            <button
              type="button"
              onClick={() => setGlobalMessage(null)}
              className="ml-2 flex-shrink-0 p-1 opacity-50 transition-opacity hover:opacity-100"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div
          role="tablist"
          aria-label="Settings sections"
          onKeyDown={(e) => {
            const idx = SETTINGS_TABS.findIndex((t) => t.id === activeTab);
            let next = null;
            if (e.key === "ArrowRight") next = SETTINGS_TABS[(idx + 1) % SETTINGS_TABS.length].id;
            if (e.key === "ArrowLeft") next = SETTINGS_TABS[(idx - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length].id;
            if (next) {
              e.preventDefault();
              setActiveTab(next);
            }
          }}
          className="flex flex-wrap gap-1 rounded-2xl border border-amber-100 bg-amber-50/60 p-1.5 shadow-sm sm:flex-nowrap"
        >
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-settings-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-md shadow-amber-200"
                    : "text-amber-600 hover:bg-amber-100 hover:text-amber-800"
                }`}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{tab.label}</span>
                  <span className={`block truncate text-xs ${isActive ? "text-amber-100" : "text-amber-500"}`}>
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "company" && (
        <div id="company-settings-panel" role="tabpanel" className="max-w-9xl animate-slideIn">
          {companyDetailsDirty && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <FiAlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                You have unsaved changes. Save them or reset to keep the previous company details.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm lg:col-span-3">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <FiHome className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-amber-900">Company details</h2>
                </div>
                <p className="mt-0.5 text-sm text-amber-600">
                  These details appear on tokens and printed certificates.
                </p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
                      {companyDetails.logo ? (
                        <img
                          src={companyDetails.logo}
                          alt="Company logo"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <FiImage className="h-6 w-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="company-logo"
                        className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50"
                      >
                        <FiUpload className="h-4 w-4" />
                        {companyDetails.logo ? "Change logo" : "Upload logo"}
                      </label>
                      <input
                        id="company-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {companyDetails.logo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          Remove logo
                        </button>
                      )}
                    </div>
                  </div>
                  <TextField
                    id="company-name"
                    label="Company name"
                    icon={FiHome}
                    value={companyDetails.name}
                    onChange={(v) => updateCompanyField("name", v)}
                    placeholder="company name"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TextField
                    id="company-tagline"
                    label="Tagline"
                    icon={FiInfo}
                    value={companyDetails.tagline}
                    onChange={(v) => updateCompanyField("tagline", v)}
                    placeholder="tagline or slogan"
                  />
                  <TextField
                    id="company-phone"
                    label="Phone number"
                    icon={FiPhone}
                    type="tel"
                    value={companyDetails.phone}
                    onChange={(v) => updateCompanyField("phone", v)}
                    placeholder="phone number"
                  />
                  <TextField
                    id="company-alternate-phone"
                    label="Alternate phone"
                    icon={FiPhone}
                    type="tel"
                    value={companyDetails.alternatePhone}
                    onChange={(v) => updateCompanyField("alternatePhone", v)}
                    placeholder="optional phone number"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TextField
                    id="company-email"
                    label="Email address"
                    icon={FiMail}
                    type="email"
                    value={companyDetails.email}
                    onChange={(v) => updateCompanyField("email", v)}
                    placeholder="company@example.com"
                  />
                  <TextField
                    id="company-website"
                    label="Website"
                    icon={FiGlobe}
                    value={companyDetails.website}
                    onChange={(v) => updateCompanyField("website", v)}
                    placeholder="www.company.com"
                  />
                  <TextField
                    id="company-gstin"
                    label="GSTIN / Tax ID"
                    icon={FiHash}
                    value={companyDetails.gstin}
                    onChange={(v) => updateCompanyField("gstin", v)}
                    placeholder="33ABCDE1234F1Z5"
                  />
                </div>
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company-address" className="mb-1.5 flex items-center text-sm font-medium text-amber-900">
                      <FiMapPin className="w-4 h-4 mr-1.5 text-amber-600" />
                      Business address
                    </label>
                    <textarea
                      id="company-address"
                      rows="2"
                      value={companyDetails.address}
                      onChange={(event) => updateCompanyField("address", event.target.value)}
                      placeholder="Street, area, district, PIN code"
                      className="w-full resize-y rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <TextField
                    id="company-city"
                    label="City"
                    icon={FiMapPin}
                    value={companyDetails.city}
                    onChange={(v) => updateCompanyField("city", v)}
                    placeholder="city"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField
                    id="company-state"
                    label="State"
                    icon={FiMapPin}
                    value={companyDetails.state}
                    onChange={(v) => updateCompanyField("state", v)}
                    placeholder="state"
                  />
                  <TextField
                    id="company-pincode"
                    label="PIN code"
                    icon={FiMapPin}
                    type="tel"
                    value={companyDetails.pincode}
                    onChange={(v) => updateCompanyField("pincode", v)}
                    placeholder="PIN code"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-amber-100 pt-3">
                <button
                  type="button"
                  onClick={resetCompanyDetails}
                  disabled={!companyDetailsDirty}
                  className="flex items-center rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiRotateCcw className="mr-1.5 h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={saveCompanyDetails}
                  disabled={companySaveStatus === "saved" || companySaveStatus === "saving"}
                  className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
                    companySaveStatus === "saved"
                      ? "bg-green-600"
                      : companySaveStatus === "saving"
                      ? "bg-amber-400 cursor-wait"
                      : "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600"
                  }`}
                >
                  {companySaveStatus === "saved" ? (
                    <FiCheckCircle className="mr-1.5 h-4 w-4" />
                  ) : companySaveStatus === "saving" ? (
                    <FiRefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <FiSave className="mr-1.5 h-4 w-4" />
                  )}
                  {companySaveStatus === "saved"
                    ? "Saved!"
                    : companySaveStatus === "saving"
                    ? "Saving..."
                    : "Save company details"}
                </button>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FiEye className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">Live preview</h3>
                </div>
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-4">
                  <div className="text-center">
                    {companyDetails.logo && (
                      <img
                        src={companyDetails.logo}
                        alt="Company logo"
                        className="mx-auto mb-2 h-14 w-14 object-contain"
                      />
                    )}
                    <p className="text-lg font-extrabold uppercase tracking-wide text-amber-900">
                      {companyDetails.name || "Company name"}
                    </p>
                    <p className="text-sm font-medium text-amber-700">{companyDetails.tagline || "Tagline"}</p>
                    {companyDetails.gstin && (
                      <p className="mt-1 text-xs text-amber-600">GSTIN: {companyDetails.gstin}</p>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 border-t border-amber-200 pt-3 text-xs text-amber-700">
                    {companyDetails.address && (
                      <p className="flex items-start">
                        <FiMapPin className="mr-1.5 mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        {companyDetails.address}
                      </p>
                    )}
                    {companyDetails.phone && (
                      <p className="flex items-center">
                        <FiPhone className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        {companyDetails.phone}
                      </p>
                    )}
                    {companyDetails.email && (
                      <p className="flex items-center">
                        <FiMail className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        {companyDetails.email}
                      </p>
                    )}
                    {companyDetails.website && (
                      <p className="flex items-center">
                        <FiGlobe className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        {companyDetails.website}
                      </p>
                    )}
                    {!companyDetails.address && !companyDetails.phone && !companyDetails.email && !companyDetails.website && (
                      <p className="text-amber-400">Fill in the fields to see a live preview.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="flex items-start text-sm text-amber-800">
                  <FiInfo className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  Company details are stored on this device and used on the printed token receipts and certificates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "printer" && (
        <div id="printer-settings-panel" role="tabpanel" className="animate-slideIn">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-6xl">
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
        </div>
      )}

      {activeTab === "preferences" && (
        <div id="preferences-settings-panel" role="tabpanel" className="max-w-5xl animate-slideIn">
          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-amber-900">Application preferences</h2>
                <p className="mt-1 text-sm text-amber-600">
                  Control how the app behaves and how reports are printed.
                </p>
              </div>
              <FiSliders className="h-6 w-6 flex-shrink-0 text-amber-500" />
            </div>
            <div className="space-y-4">
              <ToggleField
                label="Show confirmation after saving"
                icon={FiCheckCircle}
                value={showSaveConfirmation}
                onChange={updateSaveConfirmation}
                description="Display a confirmation message when settings are saved."
              />
              <ToggleField
                label="Print only values on Skin Test certificates"
                icon={FiPrinter}
                value={printValuesOnly}
                onChange={updatePrintValuesOnly}
                description="When enabled, the certificate omits the logo and decorative header and prints only the test values."
              />
              {printValuesOnlySaved && (
                <p className="flex items-center text-sm text-green-700">
                  <FiCheckCircle className="w-4 h-4 mr-1.5" />
                  Preference saved and applied instantly.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "about" && (
        <div id="about-settings-panel" role="tabpanel" className="max-w-5xl animate-slideIn">
          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-4">
              <FiInfo className="h-6 w-6 flex-shrink-0 text-amber-600" />
              <div>
                <h2 className="text-lg font-bold text-amber-900">About SS GOLD</h2>
                <p className="text-sm leading-6 text-amber-700">
                  Company information is stored on this device. Printer profiles are managed by
                  the Electron application and remain available after restarting it.
                </p>
              </div>
            </div>

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
        </div>
      )}

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
