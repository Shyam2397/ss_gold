import React, { memo, useCallback } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const DeleteConfirmationModal = ({ onCancel, onConfirm }) => {
  // Handle keyboard events for better accessibility
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  // Handle Enter key for confirmation
  const handleConfirmKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  }, [onConfirm]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full"
        role="document"
      >
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
          <h3 
            id="modal-title"
            className="text-lg font-medium text-gray-900 mb-2"
          >
            Confirm Deletion
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this token? 
            This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              onKeyDown={handleConfirmKeyDown}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Confirm deletion"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(DeleteConfirmationModal, (prevProps, nextProps) => {
  // Only re-render if the handlers have changed
  return prevProps.onCancel === nextProps.onCancel && 
         prevProps.onConfirm === nextProps.onConfirm;
});