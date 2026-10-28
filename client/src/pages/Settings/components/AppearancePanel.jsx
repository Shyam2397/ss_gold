import {
  FiType,
  FiRefreshCw,
} from "react-icons/fi";
import {
  setAppearanceValue,
  resetAppearance,
  useAppearance,
} from "../../../lib/appearance";
import { SelectField, TextField } from "./fields";

const FONT_SCALE_OPTIONS = [
  { value: 0.9, label: "Compact (90%)" },
  { value: 1, label: "Default (100%)" },
  { value: 1.1, label: "Large (110%)" },
  { value: 1.25, label: "Extra large (125%)" },
];

const AppearancePanel = () => {
  const { typography } = useAppearance();

  const changeTypo = (key) => (value) => setAppearanceValue("typography", key, value);

  return (
    <div id="appearance-settings-panel" role="tabpanel" className="animate-slideIn">
      <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-amber-900">Appearance</h2>
            <p className="mt-0.5 text-xs text-amber-600">
              Personalise fonts. Applied everywhere and saved to this account
              on this device.
            </p>
          </div>
        </div>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <FiType className="h-4 w-4 text-amber-600" />
            Typography
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              label="Font family"
              icon={FiType}
              value={typography.fontFamily}
              onChange={changeTypo("fontFamily")}
              placeholder="Poppins"
              compact
            />
            <SelectField
              label="Font size"
              icon={FiType}
              value={typography.fontScale}
              onChange={(value) => changeTypo("fontScale")(Number(value))}
              options={FONT_SCALE_OPTIONS}
              compact
            />
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 pt-3">
          <p className="text-xs text-amber-500">These values apply to every screen.</p>
          <button
            type="button"
            onClick={resetAppearance}
            className="flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearancePanel;
