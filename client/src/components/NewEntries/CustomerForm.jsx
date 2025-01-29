import React from 'react';
import { MdPersonAdd } from 'react-icons/md';
import { FiAlertCircle } from 'react-icons/fi';

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
  resetForm,
  setName,
  setCode,
  setPhoneNumber,
  setPlace
}) => {
  const renderInput = (label, id, value, onChange, placeholder) => (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-amber-900 mb-2"
      >
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-4 pr-10 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
        required
      />
    </div>
  );

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-6 border border-amber-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-3">
            <MdPersonAdd className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900">
            {editMode ? "Edit Customer" : "New Customer"}
          </h2>
        </div>
        {/* Error/Success Messages */}
        {(error || success) && (
          <div className={`p-1 rounded-lg ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}> 
          <div className="flex items-center">
          <FiAlertCircle className="h-5 w-5 text-red-400 mr-3" />
          {error || success}
          </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div 
          className="space-y-4 p-4 bg-amber-50 rounded-lg"
        >
          {renderInput(
            "Name", 
            "name", 
            name, 
            handleInputChange(setName), 
            "Enter name"
          )}
          {renderInput(
            "Code", 
            "code", 
            code, 
            handleInputChange(setCode), 
            "Enter code"
          )}
        </div>

        <div 
          className="space-y-4 p-4 bg-amber-50 rounded-lg"
        >
          {renderInput(
            "Phone Number", 
            "phoneNumber", 
            phoneNumber, 
            handleInputChange(setPhoneNumber), 
            "Enter phone number"
          )}
          {renderInput(
            "Place", 
            "place", 
            place, 
            handleInputChange(setPlace), 
            "Enter place"
          )}
        </div>

        <div className="md:col-span-2 flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-lg hover:from-amber-700 hover:to-yellow-600 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : editMode ? (
              "Update Customer"
            ) : (
              "Add Customer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
