import React from 'react';
import { FiSave, FiRotateCcw, FiPlusSquare } from 'react-icons/fi';

const FormActions = ({ loading, onReset, onOpenMasterExpense, isEditing = false, isMasterExpenseOpen = false }) => (
  <div className="flex justify-end space-x-3 pt-1 mt-2">
    {!isMasterExpenseOpen && (
      <button
        type="button"
        onClick={onOpenMasterExpense}
        disabled={loading}
        className="inline-flex items-center px-3 py-1.5 h-8 text-sm font-medium rounded-xl border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FiPlusSquare className="mr-1.5 h-3.5 w-3.5" />
        Master Expense
      </button>
    )}
    <button
      type="button"
      onClick={onReset}
      disabled={loading}
      className="inline-flex items-center px-4 py-1.5 h-8 text-sm font-medium rounded-xl border border-amber-200 text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <FiRotateCcw className="mr-1.5 h-3 w-3" />
      Reset Form
    </button>
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center px-4 py-1.5 h-8 text-sm font-medium rounded-xl border border-transparent text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <FiSave className="mr-1.5 h-3 w-3" />
      {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Save Expense'}
    </button>
  </div>
);

export default FormActions;
