import React from 'react';
import { MdPersonAdd } from 'react-icons/md';
import { FiAlertCircle, FiUser, FiHash, FiPhone, FiMapPin,FiSave, FiRotateCcw } from 'react-icons/fi';
import FormField from './components/FormField';

const CustomerForm = ({
  editMode,
  loading,
  name,
  code,
  phoneNumber,
  place,
  error,
  success,
  handleInputChange,
  handleSubmit,
  resetForm
}) => {
  return (
    <div className="bg-white rounded-2xl p-3 border border-amber-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div className="flex items-center">
          <MdPersonAdd className="w-6 h-6 text-amber-600 mr-2" />
          <h2 className="text-lg font-bold text-amber-900">
            {editMode ? "Edit Customer" : "New Customer"}
          </h2>
        </div>
        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <FiAlertCircle className="mr-1 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="text-green-600 text-sm">
            {success}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mx-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-3 bg-amber-50/50 rounded-lg border border-amber-100 ">
          <FormField
            label="Name"
            id="name"
            value={name}
            onChange={handleInputChange('name')}
            placeholder="Enter customer name"
            icon={FiUser}
          />
          
          <FormField
            label="Code"
            id="code"
            value={code}
            onChange={handleInputChange('code')}
            placeholder="Enter customer code"
            icon={FiHash}
          />
          
          <FormField
            label="Phone Number"
            id="phoneNumber"
            value={phoneNumber}
            onChange={handleInputChange('phoneNumber')}
            placeholder="Enter phone number"
            icon={FiPhone}
          />
          
          <FormField
            label="Place"
            id="place"
            value={place}
            onChange={handleInputChange('place')}
            placeholder="Enter place"
            icon={FiMapPin}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-sm border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-all"
          >
            <FiRotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-xl hover:from-amber-700 hover:to-yellow-600 transition-all"
          >
            <FiSave className="mr-1.5 h-4 w-4" />
            {loading ? 'Saving...' : editMode ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
