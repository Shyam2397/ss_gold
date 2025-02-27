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
  // Sort customers alphabetically by name
  const sortedCustomers = [...customers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="mt-4 bg-white rounded-2xl p-3 border border-amber-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center">
          <BsQrCode className="w-5 h-5 text-amber-600 mr-2" />
          <h3 className="text-lg font-bold text-amber-900">
            Customer List
          </h3>
        </div>
        <div className="relative rounded-md shadow-sm w-full sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-md border border-amber-200 bg-white pl-10 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 py-2 text-sm text-amber-900"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-lg border border-amber-100">
          <div className="overflow-x-auto">
            <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
              <table className="min-w-full divide-y divide-amber-50">
                <thead className="bg-gradient-to-r from-amber-600 to-yellow-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                    <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Phone</th>
                    <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Place</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-50">
                  {sortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-4 text-center text-sm text-amber-900">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    sortedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-3 py-2 text-sm text-amber-900">{customer.code}</td>
                        <td className="px-3 py-2 text-sm text-amber-900">{customer.name}</td>
                        <td className="hidden sm:table-cell px-3 py-2 text-sm text-amber-900">{customer.phoneNumber}</td>
                        <td className="hidden md:table-cell px-3 py-2 text-sm text-amber-900">{customer.place}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="p-1 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded"
                              title="Edit customer"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(customer.id)}
                              className="p-1 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded"
                              title="Delete customer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
