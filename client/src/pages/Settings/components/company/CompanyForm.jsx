import {
  FiHome,
  FiInfo,
  FiPhone,
  FiMail,
  FiGlobe,
  FiHash,
  FiMapPin,
  FiImage,
  FiUpload,
  FiTrash2,
  FiRotateCcw,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
} from "react-icons/fi";
import { TextField } from "../fields";

const CompanyForm = ({
  companyDetails,
  onChangeField,
  onLogoUpload,
  onRemoveLogo,
  onReset,
  onSave,
  saveStatus,
  dirty,
}) => (
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
              onChange={onLogoUpload}
              className="hidden"
            />
            {companyDetails.logo && (
              <button
                type="button"
                onClick={onRemoveLogo}
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
          onChange={(v) => onChangeField("name", v)}
          placeholder="company name"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          id="company-tagline"
          label="Tagline"
          icon={FiInfo}
          value={companyDetails.tagline}
          onChange={(v) => onChangeField("tagline", v)}
          placeholder="tagline or slogan"
        />
        <TextField
          id="company-phone"
          label="Phone number"
          icon={FiPhone}
          type="tel"
          value={companyDetails.phone}
          onChange={(v) => onChangeField("phone", v)}
          placeholder="phone number"
        />
        <TextField
          id="company-alternate-phone"
          label="Alternate phone"
          icon={FiPhone}
          type="tel"
          value={companyDetails.alternatePhone}
          onChange={(v) => onChangeField("alternatePhone", v)}
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
          onChange={(v) => onChangeField("email", v)}
          placeholder="company@example.com"
        />
        <TextField
          id="company-website"
          label="Website"
          icon={FiGlobe}
          value={companyDetails.website}
          onChange={(v) => onChangeField("website", v)}
          placeholder="www.company.com"
        />
        <TextField
          id="company-gstin"
          label="GSTIN / Tax ID"
          icon={FiHash}
          value={companyDetails.gstin}
          onChange={(v) => onChangeField("gstin", v)}
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
            onChange={(event) => onChangeField("address", event.target.value)}
            placeholder="Street, area, district, PIN code"
            className="w-full resize-y rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <TextField
          id="company-city"
          label="City"
          icon={FiMapPin}
          value={companyDetails.city}
          onChange={(v) => onChangeField("city", v)}
          placeholder="city"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          id="company-state"
          label="State"
          icon={FiMapPin}
          value={companyDetails.state}
          onChange={(v) => onChangeField("state", v)}
          placeholder="state"
        />
        <TextField
          id="company-pincode"
          label="PIN code"
          icon={FiMapPin}
          type="tel"
          value={companyDetails.pincode}
          onChange={(v) => onChangeField("pincode", v)}
          placeholder="PIN code"
        />
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-amber-100 pt-3">
      <button
        type="button"
        onClick={onReset}
        disabled={!dirty}
        className="flex items-center rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiRotateCcw className="mr-1.5 h-4 w-4" />
        Reset
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveStatus === "saved" || saveStatus === "saving"}
        className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
          saveStatus === "saved"
            ? "bg-green-600"
            : saveStatus === "saving"
            ? "bg-amber-400 cursor-wait"
            : "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600"
        }`}
      >
        {saveStatus === "saved" ? (
          <FiCheckCircle className="mr-1.5 h-4 w-4" />
        ) : saveStatus === "saving" ? (
          <FiRefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <FiSave className="mr-1.5 h-4 w-4" />
        )}
        {saveStatus === "saved"
          ? "Saved!"
          : saveStatus === "saving"
          ? "Saving..."
          : "Save company details"}
      </button>
    </div>
  </div>
);

export default CompanyForm;
