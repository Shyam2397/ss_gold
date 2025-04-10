import React, { useReducer, useEffect, useCallback, Suspense } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import { customerReducer, initialState, ActionTypes } from './customerReducer';
import useCustomerAPI from './hooks/useCustomerAPI';

const CustomerForm = React.lazy(() => import('./CustomerForm'));
const CustomerList = React.lazy(() => import('./CustomerList'));
const DeleteConfirmationModal = React.lazy(() => import('./DeleteConfirmationModal'));

const API_URL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API_URL;

const NewEntries = () => {
  const [state, dispatch] = useReducer(customerReducer, initialState);
  const { customers, isLoading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomerAPI(dispatch, ActionTypes);

  // Message timeout duration
  const MESSAGE_TIMEOUT = 5000;

  // Auto-clear messages after timeout
  useEffect(() => {
    let errorTimer, successTimer;

    if (state.error) {
      errorTimer = setTimeout(() => {
        dispatch({ type: ActionTypes.SET_ERROR, payload: '' });
      }, MESSAGE_TIMEOUT);
    }

    if (state.success) {
      successTimer = setTimeout(() => {
        dispatch({ type: ActionTypes.SET_SUCCESS, payload: '' });
      }, MESSAGE_TIMEOUT);
    }

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
      if (successTimer) clearTimeout(successTimer);
    };
  }, [state.error, state.success]);

  // React Query handles data fetching automatically

  // Filter customers based on search query
  const filteredCustomers = (customers || []).filter((customer) =>
    Object.values(customer)
      .join(" ")
      .toLowerCase()
      .includes(state.searchQuery.toLowerCase())
  );

  // Validate form data
  const validateForm = () => {
    if (!state.code || state.code.trim().length === 0) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Customer code is required" });
      return false;
    }

    if (!state.name || state.name.trim().length === 0) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Customer name is required" });
      return false;
    }

    if (!state.phoneNumber || state.phoneNumber.trim().length === 0) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Phone number is required" });
      return false;
    }

    // Phone number validation (allow only numbers and optional +)
    const phoneRegex = /^\+?\d{10,12}$/;
    if (!phoneRegex.test(state.phoneNumber)) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Invalid phone number format. Please enter 10-12 digits with optional + prefix" });
      return false;
    }

    if (!state.place || state.place.trim().length === 0) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Place is required" });
      return false;
    }

    // Check for duplicate code
    const duplicateCode = customers.find(
      customer => customer.code === state.code.trim() && 
      (!state.editMode || customer.id !== state.editId)
    );
    if (duplicateCode) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Customer code already exists" });
      return false;
    }

    // Check for duplicate phone number
    const duplicatePhone = customers.find(
      customer => customer.phoneNumber === state.phoneNumber.trim() && 
      (!state.editMode || customer.id !== state.editId)
    );
    if (duplicatePhone) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: "Phone number already exists" });
      return false;
    }

    return true;
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const customerData = {
      code: state.code.trim(),
      name: state.name.trim(),
      phoneNumber: state.phoneNumber.trim(),
      place: state.place.trim(),
    };

    try {
      if (state.editMode) {
        await updateCustomer(state.editId, customerData);
      } else {
        await createCustomer(customerData);
      }
      dispatch({ type: ActionTypes.RESET_FORM });
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  // Simplify these handlers to use dispatch directly
  const handleEdit = useCallback((customer) => {
    dispatch({
      type: ActionTypes.SET_EDIT_MODE,
      payload: { customer }
    });
  }, []);

  const confirmDelete = useCallback((id) => {
    dispatch({
      type: ActionTypes.SET_DELETE_CONFIRMATION,
      payload: { isOpen: true, customerId: id }
    });
  }, []);

  const cancelDelete = useCallback(() => {
    dispatch({
      type: ActionTypes.SET_DELETE_CONFIRMATION,
      payload: { isOpen: false, customerId: null }
    });
  }, []);

  const proceedDelete = async () => {
    if (!state.deleteConfirmation.customerId) return;
    
    try {
      await deleteCustomer(state.deleteConfirmation.customerId);
      dispatch({
        type: ActionTypes.SET_DELETE_CONFIRMATION,
        payload: { isOpen: false, customerId: null }
      });
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const handleInputChange = (field) => (e) => {
    dispatch({ 
      type: ActionTypes.SET_FIELD, 
      field, 
      value: e.target.value 
    });
  };

  const handleReset = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_FORM });
  }, []);

  return (
    <div className="container mx-auto px-8 py-5">
      <Suspense fallback={<LoadingSpinner />}>
        <CustomerForm
          editMode={state.editMode}
          loading={isLoading}
          name={state.name}
          code={state.code}
          phoneNumber={state.phoneNumber}
          place={state.place}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          resetForm={handleReset}
          error={state.error}
          success={state.success}
        />

        <CustomerList
          loading={isLoading}
          customers={filteredCustomers}
          searchQuery={state.searchQuery}
          setSearchQuery={(value) => dispatch({ 
            type: ActionTypes.SET_FIELD, 
            field: 'searchQuery', 
            value 
          })}
          handleEdit={handleEdit}
          confirmDelete={confirmDelete}
          onReset={handleReset}
        />

        <DeleteConfirmationModal
          isOpen={state.deleteConfirmation.isOpen}
          onCancel={cancelDelete}
          onConfirm={proceedDelete}
        />
      </Suspense>
    </div>
  );
};

export default NewEntries;
