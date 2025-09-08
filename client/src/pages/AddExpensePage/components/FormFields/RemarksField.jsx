import React from 'react';

const RemarksField = ({ value, onChange }) => (
  <div className="w-full">
    <label htmlFor="remarks" className="block text-xs font-medium text-amber-700 mb-1.5">
      Remarks
    </label>
    <div className="relative">
      <textarea
        id="remarks"
        name="remarks"
        rows={2}
        value={value}
        onChange={onChange}
        className="block w-full max-w-md px-3 py-1.5 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors resize-none"
        placeholder="Enter any additional notes"
      />
    </div>
  </div>
);

export default RemarksField;
