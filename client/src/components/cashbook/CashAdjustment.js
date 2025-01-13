import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

function CashAdjustment({ isOpen, onClose, onSave }) {
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'credit',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    remarks: ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (!adjustmentData.amount) return;

    // Pass the data to parent component
    onSave({
      ...adjustmentData,
      amount: parseFloat(adjustmentData.amount)
    });

    // Reset form
    setAdjustmentData({
      type: 'credit',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      remarks: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 bg-amber-50 rounded-t-lg border-b border-amber-100">
          <h2 className="text-lg font-semibold text-gray-800">Cash Adjustment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-amber-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 px-5">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2 text-amber-900">Adjustment Entry</h3>
              
              {/* Type Selection */}
              <div className="grid grid-cols-[100px,1fr] gap-3 text-sm items-start">
                <label className="text-gray-600">Type</label>
                <div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="type"
                        checked={adjustmentData.type === 'credit'}
                        onChange={() => setAdjustmentData(prev => ({ ...prev, type: 'credit' }))}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      Credit (+)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="type"
                        checked={adjustmentData.type === 'debit'}
                        onChange={() => setAdjustmentData(prev => ({ ...prev, type: 'debit' }))}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      Debit (-)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Will add a {adjustmentData.type} of the amount entered to the account.
                    i.e. If 100 is entered then the account will be in {adjustmentData.type} by 100.
                  </p>
                </div>
              </div>

              {/* Date and Amount Inputs */}
              <div className="grid grid-cols-2 gap-4 mb-2 items-center text-sm">
                {/* Date Selection */}
                <div>
                  <label className="text-gray-600">Date</label>
                  <input
                    type="date"
                    value={adjustmentData.date}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, date: e.target.value }))}
                    className="border rounded px-3 py-1.5 w-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-gray-600">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Rs.</span>
                    <input
                      type="number"
                      value={adjustmentData.amount}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                      className="border rounded px-3 py-1.5 w-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Remarks Input */}
              <div className="grid grid-cols-[100px,1fr] gap-3 mb-3 items-start text-sm">
                <label className="text-gray-600">Remarks</label>
                <textarea
                  value={adjustmentData.remarks}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter adjustment reason..."
                  className="border rounded px-3 py-1.5 w-full h-15 resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Existing Adjustments Section */}
            <div>
              <h3 className="font-medium mb-3 text-amber-900">Existing Adjustment(s)</h3>
              <div className="bg-amber-50/50 rounded p-6 flex items-center justify-center border border-amber-100">
                <div className="text-center text-gray-500">
                  <div className="mb-4">
                    <img 
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpath d='M8 15l2-2 4-4'%3E%3C/path%3E%3Cpath d='M16 9l-4 4-2 2'%3E%3C/path%3E%3C/svg%3E"
                      alt="No adjustments"
                      className="w-12 h-12 mx-auto opacity-50"
                    />
                  </div>
                  <p>No existing adjustments found</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-amber-50/50 rounded-b-lg flex justify-end border-t border-amber-100">
          <button
            onClick={handleSave}
            disabled={!adjustmentData.amount}
            className="bg-amber-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 hover:bg-amber-600 transition-colors"
          >
            <Save size={20} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default CashAdjustment;