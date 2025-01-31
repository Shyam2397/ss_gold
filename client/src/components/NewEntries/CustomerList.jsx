import React from 'react';
import { FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
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
    <div 
      className="mt-4 bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-amber-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center">
          <div className="mr-3 sm:mr-4">
            <BsQrCode className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" />
          </div>
          <h3 className="text-2xl sm:text-2xl md:text-3xl font-bold text-amber-900">
            Customer List
          </h3>
        </div>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-base sm:text-lg rounded-xl border-2 border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-amber-900 placeholder-amber-500"
          />
          <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-amber-400 h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-xl border-2 border-amber-100">
          <div className="overflow-x-auto">
            <div className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
              <table className="min-w-full divide-y divide-amber-200">
                <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider">Code</th>
                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider">Name</th>
                    <th className="hidden sm:table-cell px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider">Phone Number</th>
                    <th className="hidden md:table-cell px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider">Place</th>
                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                  {customers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-amber-50 transition-colors duration-200 text-amber-900"
                    >
                      <td className="px-4 sm:px-6 md:px-8 py-1 sm:py-2 md:py-3 whitespace-nowrap text-sm sm:text-lg font-medium">{customer.code}</td>
                      <td className="px-4 sm:px-6 md:px-8 py-1 sm:py-2 md:py-3 whitespace-nowrap text-sm sm:text-lg font-medium">{customer.name}</td>
                      <td className="hidden sm:table-cell px-4 sm:px-6 md:px-8 py-1 sm:py-2 md:py-3 whitespace-nowrap text-sm sm:text-lg">{customer.phoneNumber}</td>
                      <td className="hidden md:table-cell px-4 sm:px-6 md:px-8 py-1 sm:py-2 md:py-3 whitespace-nowrap text-sm sm:text-lg">{customer.place}</td>
                      <td className="px-4 sm:px-6 md:px-8 py-1 sm:py-2 md:py-3 whitespace-nowrap text-sm sm:text-lg font-medium space-x-2 sm:space-x-4 flex items-center">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-amber-600 hover:text-amber-900 transition-colors duration-200 p-1 sm:p-1.5 rounded-full hover:bg-amber-100"
                          title="Edit Customer"
                        >
                          <FiEdit2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button
                          onClick={() => confirmDelete(customer.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 sm:p-1.5 rounded-full hover:bg-red-100"
                          title="Delete Customer"
                        >
                          <FiTrash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
