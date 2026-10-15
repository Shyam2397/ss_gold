import { FiSliders, FiCheckCircle, FiPrinter } from "react-icons/fi";
import { ToggleField } from "./fields";

const PreferencesPanel = ({
  showSaveConfirmation,
  onSaveConfirmationChange,
  printValuesOnly,
  onPrintValuesOnlyChange,
  printValuesOnlySaved,
}) => (
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
          onChange={onSaveConfirmationChange}
          description="Display a confirmation message when settings are saved."
        />
        <ToggleField
          label="Print only values on Skin Test certificates"
          icon={FiPrinter}
          value={printValuesOnly}
          onChange={onPrintValuesOnlyChange}
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
);

export default PreferencesPanel;
