import React from 'react';
import { motion } from 'framer-motion';
import { MdPersonAdd } from 'react-icons/md';
import { formSectionVariants, headingIconVariants, buttonVariants, inputVariants } from './animations';

const CustomerForm = ({
  editMode,
  loading,
  name,
  code,
  phoneNumber,
  place,
  handleInputChange,
  handleSubmit,
  resetForm,
  setName,
  setCode,
  setPhoneNumber,
  setPlace
}) => {
  const renderMotionInput = (label, id, value, onChange, placeholder) => (
    <motion.div
      variants={inputVariants}
      initial="initial"
      animate="animate"
      whileFocus="focus"
      className="relative"
    >
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
    </motion.div>
  );

  return (
    <motion.div
      variants={formSectionVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="bg-white rounded-xl shadow-sm p-6 border border-amber-100"
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
            <MdPersonAdd className="w-8 h-8 text-amber-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-amber-900">
            {editMode ? "Edit Customer" : "New Customer"}
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <motion.div 
          variants={formSectionVariants}
          className="space-y-4 p-4 bg-amber-50 rounded-lg"
        >
          {renderMotionInput(
            "Name", 
            "name", 
            name, 
            handleInputChange(setName), 
            "Enter name"
          )}
          {renderMotionInput(
            "Code", 
            "code", 
            code, 
            handleInputChange(setCode), 
            "Enter code"
          )}
        </motion.div>

        <motion.div 
          variants={formSectionVariants}
          className="space-y-4 p-4 bg-amber-50 rounded-lg"
        >
          {renderMotionInput(
            "Phone Number", 
            "phoneNumber", 
            phoneNumber, 
            handleInputChange(setPhoneNumber), 
            "Enter phone number"
          )}
          {renderMotionInput(
            "Place", 
            "place", 
            place, 
            handleInputChange(setPlace), 
            "Enter place"
          )}
        </motion.div>

        <div className="md:col-span-2 flex justify-end space-x-4">
          <motion.button
            type="button"
            onClick={resetForm}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
          >
            Reset
          </motion.button>
          <motion.button
            type="submit"
            disabled={loading}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
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
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default CustomerForm;
