import React, { useReducer, useEffect, useCallback, useMemo, memo, Suspense } from 'react';
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
  const { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomerAPI(dispatch, ActionTypes);

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

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search query
  const filteredCustomers = state.customers.filter((customer) =>
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

    return true;
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    const customerData = {
      code: state.code.trim(),
      name: state.name.trim(),
      phoneNumber: state.phoneNumber.trim(),
      place: state.place.trim(),
    };

    const success = state.editMode 
      ? await updateCustomer(state.editId, customerData)
      : await createCustomer(customerData);

    if (success) {
      dispatch({ type: ActionTypes.RESET_FORM });
    }
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
  };

  // Handle customer edit
  const handleEdit = (customer) => {
    dispatch({
      type: ActionTypes.SET_EDIT_MODE,
      payload: { customer }
    });
  };

  // Handle delete confirmation
  const confirmDelete = (id) => {
    dispatch({
      type: ActionTypes.SET_DELETE_CONFIRMATION,
      payload: { isOpen: true, customerId: id }
    });
  };

  // Handle delete cancellation
  const cancelDelete = () => {
    dispatch({
      type: ActionTypes.SET_DELETE_CONFIRMATION,
      payload: { isOpen: false, customerId: null }
    });
  };

  // Handle delete confirmation
  const proceedDelete = async () => {
    if (!state.deleteConfirmation.customerId) return;
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    await deleteCustomer(state.deleteConfirmation.customerId);
    
    dispatch({
      type: ActionTypes.SET_DELETE_CONFIRMATION,
      payload: { isOpen: false, customerId: null }
    });
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
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
          loading={state.loading}
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
          loading={state.loading}
          customers={filteredCustomers}
          searchQuery={state.searchQuery}
          setSearchQuery={(value) => dispatch({ 
            type: ActionTypes.SET_FIELD, 
            field: 'searchQuery', 
            value 
          })}
          handleEdit={(customer) => dispatch({
            type: ActionTypes.SET_EDIT_MODE,
            payload: { customer }
          })}
          confirmDelete={(id) => dispatch({
            type: ActionTypes.SET_DELETE_CONFIRMATION,
            payload: { isOpen: true, customerId: id }
          })}
          onReset={handleReset}
        />

        <DeleteConfirmationModal
          isOpen={state.deleteConfirmation.isOpen}
          onCancel={() => dispatch({
            type: ActionTypes.SET_DELETE_CONFIRMATION,
            payload: { isOpen: false, customerId: null }
          })}
          onConfirm={proceedDelete}
        />
      </Suspense>
    </div>
  );
};

export default NewEntries;
