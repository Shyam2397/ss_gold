import {
  FiPrinter,
  FiFileText,
  FiMonitor,
  FiCopy,
  FiSettings,
  FiEye,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { SelectField, NumberField, ToggleField } from "./fields";
import { ORIENTATIONS, COLOR_OPTIONS, PAPER_TYPES } from "../constants";

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

export default PrinterCard;
