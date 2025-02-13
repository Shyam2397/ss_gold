import React from 'react';
import { MdPersonAdd } from 'react-icons/md';
import { FiAlertCircle, FiUser, FiHash, FiPhone, FiMapPin } from 'react-icons/fi';

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
  const renderInput = (label, id, value, onChange, placeholder, icon = FiUser) => (
    <div className="relative">
      <label
        htmlFor={id}
        className="text-sm font-medium text-amber-900 mb-1 flex items-center"
      >
        {React.createElement(icon, { className: "h-3.5 w-3.5 text-amber-600 mr-1.5" })}
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 text-sm rounded border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-amber-900"
        required
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-3 border border-amber-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center">
          <MdPersonAdd className="w-5 h-5 text-amber-600 mr-2" />
          <h2 className="text-lg font-bold text-amber-900">
            {editMode ? "Edit Customer" : "New Customer"}
          </h2>
        </div>
        {(error || success) && (
          <div className={`px-2 py-0.5 rounded ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} text-xs`}> 
            <div className="flex items-center">
              <FiAlertCircle className="h-3.5 w-3.5 mr-1.5" />
              {error || success}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
      >
        <div className="space-y-2 p-2 bg-amber-50/30 rounded">
          {renderInput(
            "Name", 
            "name", 
            name, 
            handleInputChange(setName), 
            "Enter name",
            FiUser
          )}
          {renderInput(
            "Code", 
            "code", 
            code, 
            handleInputChange(setCode), 
            "Enter code",
            FiHash
          )}
        </div>

        <div className="space-y-2 p-2 bg-amber-50/30 rounded">
          {renderInput(
            "Phone Number", 
            "phoneNumber", 
            phoneNumber, 
            handleInputChange(setPhoneNumber), 
            "Enter phone number",
            FiPhone
          )}
          {renderInput(
            "Place", 
            "place", 
            place, 
            handleInputChange(setPlace), 
            "Enter place",
            FiMapPin
          )}
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row justify-end space-y-1 sm:space-y-0 sm:space-x-2 mt-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : editMode ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
