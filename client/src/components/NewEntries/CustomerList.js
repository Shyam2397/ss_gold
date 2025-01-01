import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { buttonVariants, deleteButtonVariants, containerVariants, itemVariants, headingIconVariants } from './animations';
import LoadingSpinner from './LoadingSpinner';

const CustomerList = ({
  loading,
  customers,
  searchQuery,
  setSearchQuery,
  handleEdit,
  confirmDelete
}) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 bg-white rounded-xl shadow-sm p-6 border border-amber-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <motion.div
            variants={headingIconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="mr-3"
          >
            <BsQrCode className="w-6 h-6 text-amber-600" />
          </motion.div>
          <h3 className="text-xl font-semibold text-amber-900">
            Customer List
          </h3>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-lg border border-amber-100">
          <div className="overflow-x-auto">
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
              <table className="min-w-full divide-y divide-amber-200">
                <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Place</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                  <AnimatePresence>
                    {customers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-amber-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-900">{customer.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phoneNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.place}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                          <motion.button
                            onClick={() => handleEdit(customer)}
                            variants={buttonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            className="text-amber-600 hover:text-amber-900 transition-colors duration-200 p-1 rounded-full hover:bg-amber-100"
                            title="Edit Customer"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => confirmDelete(customer.id)}
                            variants={deleteButtonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded-full hover:bg-red-100"
                            title="Delete Customer"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CustomerList;
