import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { MdPersonAdd } from "react-icons/md";
import { FiSearch, FiAlertCircle, FiEdit2, FiTrash2 } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";

const NewEntry = () => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    customerId: null
  });

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) =>
    Object.values(customer)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/entries`
      );
      setCustomers(response.data);
    } catch (err) {
      setError("Error fetching customers");
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicates = async (code, phoneNumber, id = null) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/entries`
      );
      const existingCustomers = response.data;

      const duplicateCode = existingCustomers.find(
        (customer) => customer.code === code && customer.id !== id
      );

      const duplicatePhone = existingCustomers.find(
        (customer) => customer.phoneNumber === phoneNumber && customer.id !== id
      );

      if (duplicateCode) {
        throw new Error("Customer code already exists");
      }

      if (duplicatePhone) {
        throw new Error("Phone number already exists");
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const customerData = {
      code,
      name,
      phoneNumber,
      place,
    };

    try {
      await checkDuplicates(code, phoneNumber, editMode ? editId : null);

      if (editMode) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/entries/${editId}`,
          customerData
        );
        setSuccess("Customer updated successfully!");
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/entries`,
          customerData
        );
        setSuccess("Customer added successfully!");
      }
      resetForm();
      fetchCustomers();
    } catch (err) {
      setError(
        err.message || err.response?.data?.error || "Error saving customer"
      );
      console.error("Error saving customer:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer edit
  const handleEdit = (customer) => {
    setCode(customer.code);
    setName(customer.name);
    setPhoneNumber(customer.phoneNumber);
    setPlace(customer.place);
    setEditMode(true);
    setEditId(customer.id);
    setError("");
    setSuccess("");
  };

  // Trigger delete confirmation
  const confirmDelete = (id) => {
    setDeleteConfirmation({
      isOpen: true,
      customerId: id
    });
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      customerId: null
    });
  };

  // Confirm and proceed with delete
  const proceedDelete = async () => {
    if (!deleteConfirmation.customerId) return;

    try {
      setLoading(true);
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/entries/${deleteConfirmation.customerId}`
      );
      setSuccess("Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      setError("Error deleting customer");
      console.error("Error deleting customer:", err);
    } finally {
      // Reset delete confirmation
      setDeleteConfirmation({
        isOpen: false,
        customerId: null
      });
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setCode("");
    setName("");
    setPhoneNumber("");
    setPlace("");
    setEditMode(false);
    setEditId(null);
    setError("");
    setSuccess("");
  };

  // Add state for message timeout duration
  const MESSAGE_TIMEOUT = 5000; // 5 seconds

  // Auto-clear messages after a timeout
  useEffect(() => {
    let errorTimer, successTimer;

    if (error) {
      errorTimer = setTimeout(() => {
        setError("");
      }, MESSAGE_TIMEOUT);
    }

    if (success) {
      successTimer = setTimeout(() => {
        setSuccess("");
      }, MESSAGE_TIMEOUT);
    }

    // Cleanup timers to prevent memory leaks
    return () => {
      if (errorTimer) clearTimeout(errorTimer);
      if (successTimer) clearTimeout(successTimer);
    };
  }, [error, success]);

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) {
      setError("");
    }
  };

  // Animation variants for smoother transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        type: "tween",
        duration: 0.2
      }
    }
  };

  const formVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        type: "tween",
        duration: 0.2
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { 
        type: "spring", 
        stiffness: 300 
      }
    },
    tap: { 
      scale: 0.95,
      transition: { 
        type: "spring", 
        stiffness: 500 
      }
    }
  };

  const deleteButtonVariants = {
    initial: { opacity: 0.7, scale: 1 },
    hover: { 
      opacity: 1, 
      scale: 1.1,
      transition: { 
        type: "spring", 
        stiffness: 300 
      }
    },
    tap: { 
      scale: 0.9,
      transition: { 
        type: "spring", 
        stiffness: 500 
      }
    }
  };

  const inputVariants = {
    initial: { 
      opacity: 0, 
      x: -20 
    },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    focus: {
      scale: 1.02,
      borderColor: "#F59E0B", // Tailwind amber-500
      transition: {
        type: "tween",
        duration: 0.2
      }
    }
  };

  const searchVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const pageVariants = {
    initial: { 
      opacity: 0, 
      x: '-10%',
      transition: { 
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    in: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    out: { 
      opacity: 0, 
      x: '10%',
      transition: { 
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const componentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        type: 'spring',
        stiffness: 120,
        damping: 10
      }
    }
  };

  const renderMotionInput = (label, id, value, onChange, placeholder) => (
    <motion.div
      variants={inputVariants}
      initial="initial"
      animate="animate"
      whileFocus="focus"
    >
      <label
        htmlFor={id}
        className="block text-sm font-medium text-amber-900 mb-1"
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
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      style={{ width: '100%', height: '100%' }}
    >
      <div className="container mx-auto px-4 py-2">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={componentVariants}
        >
          {/* Form Section */}
          <motion.div 
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-xl shadow-sm p-6 border border-amber-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MdPersonAdd className="w-8 h-8 text-amber-600 mr-3" />
                <h2 className="text-2xl font-bold text-amber-900">
                  {editMode ? "Edit Customer" : "New Customer"}
                </h2>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-4">
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
              </div>

              <div className="space-y-4">
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
              </div>

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

          {/* Search Section */}
          <motion.div 
            variants={searchVariants}
            initial="initial"
            animate="animate"
            className="mt-4 flex justify-end"
          >
            
          </motion.div>

          {/* Customer List Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 bg-white rounded-xl shadow-sm p-6 border border-amber-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BsQrCode className="w-6 h-6 text-amber-600 mr-3" />
                <h3 className="text-xl font-semibold text-amber-900">
                  Customer List
                </h3>
              </div>
              <div className="relative w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-amber-600"
                  viewBox="0 0 24 24"
                >
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
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-amber-100">
                <div className="overflow-x-auto">
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                    <table className="min-w-full divide-y divide-amber-200">
                      <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Phone Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Place
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-amber-100">
                        <AnimatePresence>
                          {filteredCustomers.map((customer, index) => (
                            <motion.tr
                              key={customer.id}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-amber-50 transition-colors duration-200"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-900">
                                {customer.code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.phoneNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.place}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                                <motion.button
                                  onClick={() => handleEdit(customer)}
                                  variants={buttonVariants}
                                  initial="initial"
                                  whileHover="hover"
                                  whileTap="tap"
                                  className="text-amber-600 hover:text-amber-900 transition-colors duration-200 p-1 rounded-full hover:bg-amber-100"
                                  title="Edit Customer"
                                >
                                  <FiEdit2 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  onClick={() => confirmDelete(customer.id)}
                                  variants={deleteButtonVariants}
                                  initial="initial"
                                  whileHover="hover"
                                  whileTap="tap"
                                  className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded-full hover:bg-red-100"
                                  title="Delete Customer"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteConfirmation.isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full"
                >
                  <div className="text-center">
                    <FiAlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Confirm Deletion
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Are you sure you want to delete this customer? 
                      This action cannot be undone.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <motion.button
                        type="button"
                        onClick={cancelDelete}
                        variants={buttonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={proceedDelete}
                        variants={deleteButtonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NewEntry;
