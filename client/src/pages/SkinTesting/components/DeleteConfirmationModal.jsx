import React, { useState } from 'react';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';

const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };
  return isOpen && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full"
      >
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Confirm Deletion
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this customer? 
            This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Deleting...
                </>
              ) : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.onCancel === nextProps.onCancel &&
    prevProps.onConfirm === nextProps.onConfirm
  );
};

export default React.memo(DeleteConfirmationModal, areEqual);
