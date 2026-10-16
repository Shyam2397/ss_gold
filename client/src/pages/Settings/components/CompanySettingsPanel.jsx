import { FiAlertCircle } from "react-icons/fi";
import CompanyForm from "./company/CompanyForm";
import CompanyPreview from "./company/CompanyPreview";

const CompanySettingsPanel = ({
  companyDetails,
  onChangeField,
  onLogoUpload,
  onRemoveLogo,
  onReset,
  onSave,
  saveStatus,
  dirty,
}) => (
  <div id="company-settings-panel" role="tabpanel" className="animate-slideIn">
    {dirty && (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <FiAlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          You have unsaved changes. Save them or reset to keep the previous company details.
        </p>
      </div>
    )}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <CompanyForm
        companyDetails={companyDetails}
        onChangeField={onChangeField}
        onLogoUpload={onLogoUpload}
        onRemoveLogo={onRemoveLogo}
        onReset={onReset}
        onSave={onSave}
        saveStatus={saveStatus}
        dirty={dirty}
      />
      <CompanyPreview companyDetails={companyDetails} />
    </div>
  </div>
);

export default CompanySettingsPanel;
