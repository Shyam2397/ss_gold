import {
  FiSliders,
  FiCheckCircle,
  FiPrinter,
  FiTrash2,
  FiLogIn,
  FiRefreshCw,
  FiDollarSign,
} from "react-icons/fi";
import { ToggleField, SelectField, TextField, NumberField } from "./fields";

const REFRESH_OPTIONS = [
  { value: 0, label: "Off (manual refresh only)" },
  { value: 1, label: "Every minute" },
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
];

const PreferencesPanel = ({ preferences, onChange, savedKey, landingOptions = [] }) => (
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
          value={preferences.showSaveConfirmation}
          onChange={(value) => onChange("showSaveConfirmation", value)}
          description="Display a confirmation banner on this Settings page after saving."
        />
        <ToggleField
          label="Print only values on Skin Test certificates"
          icon={FiPrinter}
          value={preferences.skinTest_printValuesOnly}
          onChange={(value) => onChange("skinTest_printValuesOnly", value)}
          description="When enabled, the certificate omits the logo and decorative header and prints only the test values."
        />
        <ToggleField
          label="Confirm before deleting records"
          icon={FiTrash2}
          value={preferences.confirmBeforeDelete}
          onChange={(value) => onChange("confirmBeforeDelete", value)}
          description="Ask for confirmation before deleting entries, skin tests and tokens."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Default page after sign in"
            icon={FiLogIn}
            value={preferences.defaultLandingPath}
            onChange={(value) => onChange("defaultLandingPath", value)}
            options={[{ value: "", label: "Automatic (first allowed page)" }, ...landingOptions]}
            description="The page opened right after a successful sign in."
          />
          <SelectField
            label="Dashboard auto-refresh"
            icon={FiRefreshCw}
            value={preferences.dashboardRefreshInterval}
            onChange={(value) => onChange("dashboardRefreshInterval", Number(value))}
            options={REFRESH_OPTIONS}
            description="How often the dashboard silently reloads its data."
          />
          <TextField
            label="Currency symbol"
            icon={FiDollarSign}
            value={preferences.currencySymbol}
            onChange={(value) => onChange("currencySymbol", value)}
            placeholder="₹"
          />
          <NumberField
            label="Currency decimal places"
            value={preferences.currencyDecimals}
            onChange={(value) => onChange("currencyDecimals", value)}
            min={0}
            max={3}
          />
        </div>

        {savedKey && (
          <p className="flex items-center text-sm text-green-700">
            <FiCheckCircle className="w-4 h-4 mr-1.5" />
            Preference saved and applied instantly.
          </p>
        )}
      </div>
    </div>
  </div>
);

export default PreferencesPanel;
