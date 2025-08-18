import React, { useState, useEffect, useCallback } from 'react';
import { Download, Search, Filter, ChevronDown, ChevronUp, Plus, X, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CashAdjustment from './CashAdjustment';
import cashAdjustmentService from '../../services/cashAdjustmentService';

const CashAdjustmentList = () => {
  const navigate = useNavigate();
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: new Date().toISOString().split('T')[0],
    type: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.fromDate) params.append('from_date', filters.fromDate);
      if (filters.toDate) params.append('to_date', filters.toDate);
      if (filters.type !== 'all') params.append('type', filters.type);
      
      // Get adjustments with filters
      const adjustments = await cashAdjustmentService.getAdjustments({
        from_date: filters.fromDate,
        to_date: filters.toDate,
        type: filters.type !== 'all' ? filters.type : undefined
      });
      
      // Apply client-side search filter
      let filteredData = adjustments;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = adjustments.filter(adj => 
          adj.reason?.toLowerCase().includes(searchTerm) ||
          (adj.reference_number && adj.reference_number.toLowerCase().includes(searchTerm)) ||
          adj.remarks?.toLowerCase().includes(searchTerm)
        );
      }
      
      setAdjustments(filteredData);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
      setError('Failed to fetch adjustments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: '',
      toDate: new Date().toISOString().split('T')[0],
      type: 'all',
      search: ''
    });
  };

  const handleEdit = (adjustment) => {
    setEditingAdjustment(adjustment);
    setShowEditModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      await cashAdjustmentService.deleteAdjustment(deletingId);
      toast.success('Adjustment deleted successfully');
      fetchAdjustments(); // Refresh the list
    } catch (err) {
      console.error('Error deleting adjustment:', err);
      toast.error('Failed to delete adjustment');
    } finally {
      setShowDeleteDialog(false);
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeletingId(null);
  };

  const handleSaveSuccess = () => {
    setShowEditModal(false);
    setEditingAdjustment(null);
    fetchAdjustments(); // Refresh the list
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    handleDeleteClick(id);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Reason', 'Reference', 'Remarks', 'Entered By', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...adjustments.map(adj => (
        [
          `"${adj.date} ${adj.time || ''}"`,
          `"${adj.adjustment_type}"`,
          `"${adj.amount}"`,
          `"${adj.reason}"`,
          `"${adj.reference_number || ''}"`,
          `"${adj.remarks || ''}"`,
          `"${adj.entered_by}"`,
          `"${adj.created_at}"`
        ].join(',')
      ))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cash_adjustments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotal = (type) => {
    return adjustments
      .filter(adj => type === 'all' || adj.adjustment_type === type)
      .reduce((sum, adj) => sum + parseFloat(adj.amount || 0), 0)
      .toFixed(2);
  };

  return (
    <div className="m-4 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-amber-800">Cash Adjustments</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track all cash adjustments</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingAdjustment(null);
              setShowEditModal(true);
            }}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Adjustment
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 w-full sm:w-auto"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 mb-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
              >
                <option value="all">All Types</option>
                <option value="addition">Addition</option>
                <option value="deduction">Deduction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by reason or reference..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={fetchAdjustments}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-50">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 0H6m6 0h3" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Adjustments</p>
              <p className="text-base font-semibold text-gray-900">{adjustments.length}</p>
            </div>
          </div>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-50">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Additions</p>
              <p className="text-base font-semibold text-green-600">₹{getTotal('addition')}</p>
            </div>
          </div>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-50">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Deductions</p>
              <p className="text-base font-semibold text-red-600">₹{getTotal('deduction')}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{error}</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-amber-500 text-white rounded-t-xl">
                  <th className="px-5 py-2.5 text-center font-semibold text-sm">Date & Time</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm">Type</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm">Amount</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm hidden md:table-cell">Reason</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm hidden lg:table-cell">Reference</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm hidden xl:table-cell">Remarks</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm">Entered By</th>
                  <th className="px-5 py-2.5 text-center font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
              {adjustments.length > 0 ? (
                adjustments.map((adj) => {
                  const date = parseISO(adj.date);
                  const formattedDate = format(date, 'dd MMM yyyy');
                  const formattedTime = adj.time || '00:00';
                  const isAddition = adj.adjustment_type === 'addition';
                  
                  return (
                    <tr 
                      key={adj.id}
                      className="border-b border-amber-100 hover:bg-amber-50/70 transition-colors duration-150 text-amber-900"
                    >
                      <td className="px-5 py-2.5 whitespace-nowrap text-center font-medium">
                        <div className="text-sm">{formattedDate}</div>
                        <div className="text-xs text-amber-600">{formattedTime}</div>
                        <dl className="md:hidden mt-1">
                          <dd className="text-xs"><span className="font-medium">Reason:</span> {adj.reason}</dd>
                          <dd className="text-xs"><span className="font-medium">Ref:</span> {adj.reference_number || '-'}</dd>
                          <dd className="text-xs truncate" title={adj.remarks}><span className="font-medium">Remarks:</span> {adj.remarks || '-'}</dd>
                        </dl>
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap text-center">
                        <span 
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isAddition 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isAddition ? 'Addition' : 'Deduction'}
                        </span>
                      </td>
                      <td className={`px-5 py-2.5 whitespace-nowrap text-center font-medium ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                        {isAddition ? '+' : '-'}₹{parseFloat(adj.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap hidden md:table-cell text-center">
                        {adj.reason}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap hidden lg:table-cell text-center">
                        {adj.reference_number || '-'}
                      </td>
                      <td className="px-5 py-2.5 hidden xl:table-cell text-center max-w-xs truncate" title={adj.remarks}>
                        {adj.remarks || '-'}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <div className="flex items-center justify-center">
                          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-amber-800">
                              {adj.entered_by?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-2 hidden sm:block">
                            <p className="text-sm">{adj.entered_by}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(adj);
                            }}
                            className="text-amber-600 hover:text-amber-800 transition-colors duration-150"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(e, adj.id);
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No cash adjustments</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new cash adjustment.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setEditingAdjustment(null);
                          setShowEditModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        New Adjustment
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingAdjustment?.id ? 'Edit' : 'Add'} Cash Adjustment
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAdjustment(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CashAdjustment 
                isOpen={showEditModal}
                onClose={() => {
                  setShowEditModal(false);
                  setEditingAdjustment(null);
                }}
                onSave={handleSaveSuccess}
                initialData={editingAdjustment}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this adjustment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashAdjustmentList;
