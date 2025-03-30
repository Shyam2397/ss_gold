import React from 'react';
import PropTypes from 'prop-types';
import { FiAlertCircle } from 'react-icons/fi';

const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
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
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default React.memo(DeleteConfirmationModal);
