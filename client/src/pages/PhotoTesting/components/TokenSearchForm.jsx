import React from 'react';

const TokenSearchForm = ({ tokenNo, onTokenNoChange, onSearch, onReset, onKeyDown }) => (
  <div className="space-y-1">
    <label htmlFor="tokenInput" className="block text-sm font-medium text-amber-700">
      Token Number
    </label>
    <div className="flex items-center space-x-2">
      <input
        id="tokenInput"
        type="text"
        value={tokenNo}
        onChange={(e) => onTokenNoChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Enter Token No"
        className="px-3 py-1.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm w-40 text-amber-900"
      />
      <button 
        onClick={onSearch}
        className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors hover:from-amber-700 hover:to-yellow-600 transition-all"
      >
        Add
      </button>
      <button 
        onClick={onReset}
        className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors hover:from-amber-700 hover:to-yellow-600 transition-all"
      >
        Reset
      </button>
    </div>
  </div>
);

export default TokenSearchForm;
