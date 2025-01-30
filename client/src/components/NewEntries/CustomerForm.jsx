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
        className="block text-base font-medium text-amber-900 mb-3"
      >
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-4 sm:pl-5 pr-8 sm:pr-12 py-2.5 sm:py-3 text-base sm:text-lg rounded-xl border-2 border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
        required
      />
    </div>
  );

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-amber-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex items-center">
          <div className="mr-3 sm:mr-4">
            <MdPersonAdd className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-amber-900">
            {editMode ? "Edit Customer" : "New Customer"}
          </h2>
        </div>
        {/* Error/Success Messages */}
        {(error || success) && (
          <div className={`p-1 px-4 rounded-xl ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} text-base sm:text-lg`}> 
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 mr-2 sm:mr-3" />
              {error || success}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
      >
        <div 
          className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-amber-50 rounded-xl"
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
          className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-amber-50 rounded-xl"
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

        <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg font-medium text-amber-700 bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors duration-200"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Saving..." : editMode ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
