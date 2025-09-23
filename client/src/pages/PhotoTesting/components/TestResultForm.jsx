import React from 'react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '-');
};

const formatValue = (value, isWeight = false) => {
  if (value == null) return '-';
  return isWeight ? parseFloat(value).toFixed(3) : value;
};

const TestResultForm = ({ formData }) => (
  <>
    {/* Address and Phone */}
    <div className="text-green-600 font-medium text-[11px]">
      <p>59, Main Bazaar, Nilakottai - 624 208</p>
      <p>Ph.No - 8903225544</p>
    </div>

    {/* Form Fields */}
    <div className="grid grid-cols-2 gap-x-2 text-[11px] pt-1.5">
      <div className="flex items-center">
        <span className="text-blue-700 font-medium w-[60px]">Token No</span>
        <span className="mx-1">:</span>
        <span className="text-blue-700 font-medium">{formData.tokenNo || 'N/A'}</span>
      </div>
      <div className="flex items-center">
        <span className="text-blue-700 font-medium w-[60px]">Date</span>
        <span className="mx-1">:</span>
        <span className="text-blue-700 font-medium">
          {formatDate(formData.date)}
        </span>
      </div>
    </div>

    <div className="flex items-center text-[11px] pt-1.5">
      <span className="text-blue-700 font-medium w-[60px]">Name</span>
      <span className="mx-1">:</span>
      <span className="text-blue-700 font-medium w-auto">{formData.name || 'N/A'}</span>
    </div>

    <div className="flex items-center text-[11px] pt-1.5">
      <span className="text-blue-700 font-medium w-[60px]">Sample</span>
      <span className="mx-1">:</span>
      <span className="text-blue-700 font-medium w-auto">{formData.sample || 'N/A'}</span>
    </div>

    <div className="flex items-center text-[11px] pt-1.5">
      <span className="text-blue-700 font-medium w-[60px]">weight</span>
      <span className="mx-1">:</span>
      <span className="text-blue-700 font-medium">
        {formatValue(formData.weight, true)}
      </span>
    </div>

    {/* Results Table */}
    <div className="pt-0.5">
      <table className="border-2 border-yellow-500 w-[264px]">
        <thead>
          <tr>
            <th className="bg-green-500 text-yellow-400 text-base font-bold p-1.5 border border-yellow-500">
              GOLD %
            </th>
            <th className="bg-green-500 text-yellow-400 text-base font-bold p-1.5 border border-yellow-500">
              KARAT
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="bg-green-500 text-yellow-400 text-base font-bold p-1.5 border border-yellow-500 text-center">
              {formData.goldFineness || '0.00'}
            </td>
            <td className="bg-green-500 text-yellow-400 text-base font-bold p-1.5 border border-yellow-500 text-center">
              {formData.karat || '0.00'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Additional Test Results */}
    <div className="pt-0.5 space-y-0.5 text-[11px]">
      <div className="grid grid-cols-2">
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-[60px]">Silver</span>
          <span className="mx-1">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.silver)}</span>
        </div>
        <div></div>
      </div>
      
      <div className="grid grid-cols-2">
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-[60px]">Copper</span>
          <span className="mx-1">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.copper)}</span>
        </div>
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-[60px]">Cadmium</span>
          <span className="mx-1">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.cadmium)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-[60px]">Zinc</span>
          <span className="mx-1">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.zinc)}</span>
        </div>
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-[60px]">Remark</span>
          <span className="mx-1">:</span>
          <span className="text-red-600 font-bold">{formData.remarks || '-'}</span>
        </div>
      </div>
    </div>
  </>
);

export default TestResultForm;
