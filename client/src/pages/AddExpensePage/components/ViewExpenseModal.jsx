import React from 'react';
import { FiX } from 'react-icons/fi';

const ViewExpenseModal = ({ isOpen, onClose, expense }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Expense Details</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-amber-700">Date</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {expense ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-amber-700">Expense Type</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {expense?.expenseType?.expense_name || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-amber-700">Amount</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      ₹{expense ? parseFloat(expense.amount).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-amber-700">Paid To</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {expense?.paidTo || '-'}
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-amber-700">Payment Mode</h4>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {expense?.payMode || '-'}
                    </p>
                  </div>
                  
                  {expense?.remarks && (
                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="text-sm font-medium text-amber-700">Remarks</h4>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                        {expense.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewExpenseModal;
