import { FiEye, FiMapPin, FiPhone, FiMail, FiGlobe, FiInfo } from "react-icons/fi";

const CompanyPreview = ({ companyDetails }) => (
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
);

export default CompanyPreview;
