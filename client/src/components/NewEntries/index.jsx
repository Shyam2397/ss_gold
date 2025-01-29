import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// Get the current port from the window location or use default ports
const API_URL = import.meta.env.VITE_API_URL;
// Add axios default configuration
axios.defaults.baseURL = API_URL;

const NewEntries = () => {
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

  // Message timeout duration
  const MESSAGE_TIMEOUT = 5000;

  // Auto-clear messages after timeout
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

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
      if (successTimer) clearTimeout(successTimer);
    };
  }, [error, success]);

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

  // Validate form data
  const validateForm = () => {
    if (!code || code.trim().length === 0) {
      setError("Customer code is required");
      return false;
    }

    if (!name || name.trim().length === 0) {
      setError("Customer name is required");
      return false;
    }

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      setError("Phone number is required");
      return false;
    }

    // Phone number validation (allow only numbers and optional +)
    const phoneRegex = /^\+?\d{10,12}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Invalid phone number format. Please enter 10-12 digits with optional + prefix");
      return false;
    }

    if (!place || place.trim().length === 0) {
      setError("Place is required");
      return false;
    }

    return true;
  };

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/entries');
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err.response?.data?.error || "Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const customerData = {
      code: code.trim(),
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      place: place.trim(),
    };

    try {
      if (editMode) {
        const response = await axios.put(`/entries/${editId}`, customerData);
        if (response.data.success) {
          setSuccess(response.data.message || "Customer updated successfully!");
          resetForm();
          fetchCustomers();
        } else {
          setError(response.data.error || "Failed to update customer");
        }
      } else {
        const response = await axios.post('/entries', customerData);
        if (response.data.success) {
          setSuccess(response.data.message || "Customer added successfully!");
          resetForm();
          fetchCustomers();
        } else {
          setError(response.data.error || "Failed to add customer");
        }
      }
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(err.response?.data?.error || "Error saving customer");
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

  // Handle delete confirmation
  const confirmDelete = (id) => {
    setDeleteConfirmation({
      isOpen: true,
      customerId: id
    });
  };

  // Handle delete cancellation
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      customerId: null
    });
  };

  // Handle delete confirmation
  const proceedDelete = async () => {
    if (!deleteConfirmation.customerId) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/entries/${deleteConfirmation.customerId}`);
      
      if (response.data.success) {
        setSuccess(response.data.message || "Customer deleted successfully!");
        fetchCustomers();
      } else {
        setError(response.data.error || "Failed to delete customer");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError(err.response?.data?.error || "Error deleting customer");
    } finally {
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

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <div className="container mx-auto px-8 py-2">
      {/* Customer Form */}
      <CustomerForm
        editMode={editMode}
        loading={loading}
        name={name}
        code={code}
        phoneNumber={phoneNumber}
        place={place}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        setName={setName}
        setCode={setCode}
        setPhoneNumber={setPhoneNumber}
        setPlace={setPlace}
        error={error}
        success={success}
      />

      {/* Customer List */}
      <CustomerList
        loading={loading}
        customers={filteredCustomers}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleEdit={handleEdit}
        confirmDelete={confirmDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onCancel={cancelDelete}
        onConfirm={proceedDelete}
      />
    </div>
  );
};

export default NewEntries;
