import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';
import DeleteConfirmationModal from './DeleteConfirmationModal';

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
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/entries/${deleteConfirmation.customerId}`
      );
      setSuccess("Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      setError("Error deleting customer");
      console.error("Error deleting customer:", err);
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
