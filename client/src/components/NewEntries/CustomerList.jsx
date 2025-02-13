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
    <div className="mt-4 bg-white rounded-2xl p-3 border border-amber-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center">
          <BsQrCode className="w-5 h-5 text-amber-600 mr-2" />
          <h3 className="text-lg font-bold text-amber-900">
            Customer List
          </h3>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-8 pr-2 py-1.5 text-sm rounded border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-amber-900 placeholder-amber-400"
          />
          <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-400 h-4 w-4" />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded border border-amber-100">
          <div className="overflow-x-auto">
            <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
              <table className="min-w-full divide-y divide-amber-50">
                <thead className="bg-amber-500/90 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase">Code</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase">Name</th>
                    <th className="hidden sm:table-cell px-2 py-1.5 text-left text-xs font-medium text-white uppercase">Phone</th>
                    <th className="hidden md:table-cell px-2 py-1.5 text-left text-xs font-medium text-white uppercase">Place</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-50">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-amber-50/30 transition-colors text-amber-900"
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap text-sm">{customer.code}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-sm">{customer.name}</td>
                      <td className="hidden sm:table-cell px-2 py-1.5 whitespace-nowrap text-sm">{customer.phoneNumber}</td>
                      <td className="hidden md:table-cell px-2 py-1.5 whitespace-nowrap text-sm">{customer.place}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-sm space-x-1 flex items-center">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-amber-600 hover:text-amber-900 p-0.5 rounded hover:bg-amber-50"
                          title="Edit Customer"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(customer.id)}
                          className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"
                          title="Delete Customer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
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
