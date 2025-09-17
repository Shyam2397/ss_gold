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
  <div className="space-y-2">
    {/* Address and Phone */}
    <div className="text-green-600 font-medium text-xs pt-2">
      <p>59, Main Bazaar, Nilakottai - 624 208</p>
      <p>Ph.No - 8903225544</p>
    </div>

    {/* Form Fields */}
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="flex items-center">
        <span className="text-blue-700 font-medium w-16">Token No</span>
        <span className="mx-2">:</span>
        <span className="text-blue-700 font-medium">{formData.tokenNo || 'N/A'}</span>
      </div>
      <div className="flex items-center">
        <span className="text-blue-700 font-medium w-12">Date</span>
        <span className="mx-2">:</span>
        <span className="text-blue-700 font-medium">
          {formatDate(formData.date)}
        </span>
      </div>
    </div>

    <div className="flex items-center text-xs">
      <span className="text-blue-700 font-medium w-16">Name</span>
      <span className="mx-2">:</span>
      <span className="text-blue-700 font-medium">{formData.name || 'N/A'}</span>
    </div>

    <div className="flex items-center text-xs">
      <span className="text-blue-700 font-medium w-16">Sample</span>
      <span className="mx-2">:</span>
      <span className="text-blue-700 font-medium">{formData.sample || 'N/A'}</span>
    </div>

    <div className="flex items-center text-xs">
      <span className="text-blue-700 font-medium w-16">weight</span>
      <span className="mx-2">:</span>
      <span className="text-blue-700 font-medium">
        {formatValue(formData.weight, true)}
      </span>
    </div>

    {/* Results Table */}
    <div className="mt-3">
      <table className="border-2 border-yellow-500 w-[264px]">
        <thead>
          <tr>
            <th className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 w-20">
              GOLD %
            </th>
            <th className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 w-20">
              KARAT
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 text-center">
              {formData.goldFineness || '0.00'}
            </td>
            <td className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 text-center">
              {formData.karat || '0.00'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Additional Test Results */}
    <div className="mt-3 space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-12">Silver</span>
          <span className="mx-2">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.silver)}</span>
        </div>
        <div></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-12">Copper</span>
          <span className="mx-2">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.copper)}</span>
        </div>
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-16">Cadmium</span>
          <span className="mx-2">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.cadmium)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <span className="text-blue-700 font-medium w-12">Zinc</span>
          <span className="mx-2">:</span>
          <span className="text-blue-700 font-medium">{formatValue(formData.zinc)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-700 font-medium w-12">Remark</span>
          <span className="ml-4">:</span>
          <span className="text-red-600 font-bold">{formData.remarks || '-'}</span>
        </div>
      </div>
    </div>
  </div>
);

export default TestResultForm;
