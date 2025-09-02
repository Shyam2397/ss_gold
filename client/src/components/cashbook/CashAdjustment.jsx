import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Minus, Save } from 'lucide-react';
import cashAdjustmentService from '../../services/cashAdjustmentService';
import toast from 'react-hot-toast';

const CashAdjustment = ({ isOpen, onClose, onSave, isLoading, initialData }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5), // Current time in HH:MM format
    adjustment_type: 'addition',
    amount: '',
    reason: '',
    reference_number: '',
    remarks: '',
    entered_by: 'ADMIN' // This should be replaced with actual user from auth context
  });
  
  // Format date to YYYY-MM-DD without timezone conversion
  const getLocalDateString = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const date = new Date(dateString);
    // Use getFullYear, getMonth, getDate to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize form with initialData when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date ? getLocalDateString(initialData.date) : new Date().toISOString().split('T')[0],
        time: initialData.time || new Date().toTimeString().slice(0, 5),
        adjustment_type: initialData.adjustment_type || 'addition',
        amount: initialData.amount || '',
        reason: initialData.reason || '',
        reference_number: initialData.reference_number || '',
        remarks: initialData.remarks || '',
        entered_by: initialData.entered_by || 'admin'
      });
    } else {
      // Reset form when opening in create mode
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        adjustment_type: 'addition',
        amount: '',
        reason: '',
        reference_number: '',
        remarks: '',
        entered_by: 'admin'
      });
    }
  }, [initialData, isOpen]);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentAdjustments, setRecentAdjustments] = useState([]);

  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      const adjustments = await cashAdjustmentService.getAdjustments({ limit: 10 });
      setRecentAdjustments(adjustments);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
      setError('Failed to fetch recent adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAdjustments();
    }
  }, [isOpen, fetchAdjustments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    // Ensure date is in the correct format without timezone conversion
    const formattedDate = formData.date;
    if (!formattedDate) {
      setError('Invalid date');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please enter a reason for the adjustment');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const adjustmentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formattedDate, // Use the pre-formatted date
        time: formData.time || '00:00'
      };

      if (initialData?.id) {
        // Update existing adjustment
        await cashAdjustmentService.updateAdjustment(initialData.id, adjustmentData);
        toast.success('Adjustment updated successfully');
      } else {
        // Create new adjustment
        await cashAdjustmentService.createAdjustment(adjustmentData);
        toast.success('Adjustment created successfully');
      }
      
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('Error saving adjustment:', err);
      setError(err.response?.data?.message || 'Failed to save adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData?.id ? 'Edit' : 'Add'} Cash Adjustment
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting || isLoading}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex rounded-md border">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm ${formData.adjustment_type === 'addition' ? 'bg-green-50 text-green-700' : 'text-gray-600'}`}
                  onClick={() => setFormData(prev => ({ ...prev, adjustment_type: 'addition' }))}
                  disabled={isSubmitting || isLoading}
                >
                  <Plus size={14} className="inline mr-1" /> Add
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm ${formData.adjustment_type === 'deduction' ? 'bg-red-50 text-red-700' : 'text-gray-600'}`}
                  onClick={() => setFormData(prev => ({ ...prev, adjustment_type: 'deduction' }))}
                  disabled={isSubmitting || isLoading}
                >
                  <Minus size={14} className="inline mr-1" /> Deduct
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full text-sm rounded border-gray-300 p-1.5"
                    disabled={isSubmitting || isLoading}
                    required
                  />
                </div>
                <div>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full text-sm rounded border-gray-300 p-1.5"
                    disabled={isSubmitting || isLoading}
                    required
                  />
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full text-sm rounded border-gray-300 pl-6 pr-2 py-1.5"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  disabled={isSubmitting || isLoading}
                  required
                />
              </div>
              
              <div>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full text-sm rounded border-gray-300 p-1.5"
                  placeholder="Reason *"
                  disabled={isSubmitting || isLoading}
                  required
                />
              </div>
              
              <div>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  className="w-full text-sm rounded border-gray-300 p-1.5"
                  placeholder="Reference # (optional)"
                  disabled={isSubmitting || isLoading}
                />
              </div>
              
              <div>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full text-sm rounded border-gray-300 p-1.5"
                  placeholder="Remarks (optional)"
                  rows="2"
                  disabled={isSubmitting || isLoading}
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-xs mt-1">
                  {error}
                </div>
              )}
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className={`w-full py-1.5 text-sm rounded ${isSubmitting || isLoading ? 'bg-amber-400' : 'bg-amber-600 text-white'}`}
              >
                {isSubmitting ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
            
            <div className="border-l pl-2">
              <h3 className="text-xs font-medium mb-1 text-gray-600">Recent</h3>
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                </div>
              ) : recentAdjustments.length > 0 ? (
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 text-xs">
                  {recentAdjustments.map((adjustment) => (
                    <div key={adjustment.id} className="border rounded p-1.5 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${adjustment.adjustment_type === 'addition' ? 'text-green-600' : 'text-red-600'}`}>
                          {adjustment.adjustment_type === 'addition' ? '+' : '-'}₹{parseFloat(adjustment.amount).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(adjustment.date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})} {adjustment.time?.substring(0, 5)}
                        </span>
                      </div>
                      {adjustment.reason && (
                        <div className="text-[11px] text-gray-600 truncate">{adjustment.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-400 text-xs">
                  No adjustments yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CashAdjustment);