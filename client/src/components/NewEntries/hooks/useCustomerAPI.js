import { useCallback } from 'react';
import axios from 'axios';

const useCustomerAPI = (dispatch, ActionTypes) => {
  const fetchCustomers = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await axios.get('/entries');
      dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: response.data || [] });
    } catch (err) {
      console.error("Error fetching customers:", err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.response?.data?.error || "Error fetching customers" });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [dispatch]);

  const createCustomer = useCallback(async (customerData) => {
    try {
      const response = await axios.post('/entries', customerData);
      if (response.data.success) {
        dispatch({ type: ActionTypes.SET_SUCCESS, payload: response.data.message || "Customer added successfully!" });
        await fetchCustomers();
        return true;
      }
      dispatch({ type: ActionTypes.SET_ERROR, payload: response.data.error || "Failed to add customer" });
      return false;
    } catch (err) {
      console.error("Error creating customer:", err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.response?.data?.error || "Error creating customer" });
      return false;
    }
  }, [dispatch, fetchCustomers]);

  const updateCustomer = useCallback(async (id, customerData) => {
    try {
      const response = await axios.put(`/entries/${id}`, customerData);
      if (response.data.success) {
        dispatch({ type: ActionTypes.SET_SUCCESS, payload: response.data.message || "Customer updated successfully!" });
        await fetchCustomers();
        return true;
      }
      dispatch({ type: ActionTypes.SET_ERROR, payload: response.data.error || "Failed to update customer" });
      return false;
    } catch (err) {
      console.error("Error updating customer:", err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.response?.data?.error || "Error updating customer" });
      return false;
    }
  }, [dispatch, fetchCustomers]);

  const deleteCustomer = useCallback(async (id) => {
    try {
      const response = await axios.delete(`/entries/${id}`);
      if (response.data.success) {
        dispatch({ type: ActionTypes.SET_SUCCESS, payload: response.data.message || "Customer deleted successfully!" });
        await fetchCustomers();
        return true;
      }
      dispatch({ type: ActionTypes.SET_ERROR, payload: response.data.error || "Failed to delete customer" });
      return false;
    } catch (err) {
      console.error("Error deleting customer:", err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.response?.data?.error || "Error deleting customer" });
      return false;
    }
  }, [dispatch, fetchCustomers]);

  return {
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};

export default useCustomerAPI;
