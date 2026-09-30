import React, { memo, useCallback, useEffect, useRef } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const DeleteConfirmationModal = ({ onCancel, onConfirm, isBusy = false }) => {
  const cancelButtonRef = useRef(null);

  // Move focus into the dialog so keyboard users are not left behind it, and so
  // the Escape keydown below actually reaches the handler.
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // Escape closes. Previously this was bound to a non-focusable div and
  // nothing inside was focused, so the event never fired.
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isBusy) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel, isBusy]);

  // Trap Tab inside the dialog while it is open.
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab') return;
    const focusable = cancelButtonRef.current?.closest('[role="dialog"]')
      ?.querySelectorAll('button:not(:disabled)');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
          <h3
            id="modal-title"
            className="text-lg font-medium text-gray-900 mb-2"
          >
            Confirm Deletion
          </h3>
          <p id="modal-description" className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this token?
            This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              ref={cancelButtonRef}
              onClick={onCancel}
              disabled={isBusy}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Note: no Enter handler on the confirm button. A native <button> already fires
// onClick for Enter, so an extra onKeyDown fired the delete twice.
export default memo(DeleteConfirmationModal);
