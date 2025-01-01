import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import { buttonVariants, deleteButtonVariants } from './animations';

const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
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
                <motion.button
                  type="button"
                  onClick={onCancel}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={onConfirm}
                  variants={deleteButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
