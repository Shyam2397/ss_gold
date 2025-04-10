import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const useCustomerAPI = (dispatch, ActionTypes) => {
  const queryClient = useQueryClient();

  // Query for fetching customers
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await axios.get('/entries');
        return response.data || [];
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Error fetching customers');
      }
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: data });
    },
    onError: (err) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
    }
  });

  // Mutation for creating customer
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData) => {
      const response = await axios.post('/entries', customerData);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add customer');
      }
      return response.data;
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_SUCCESS, payload: data.message || 'Customer added successfully!' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
    }
  });

  // Mutation for updating customer
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, customerData }) => {
      const response = await axios.put(`/entries/${id}`, customerData);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update customer');
      }
      return response.data;
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_SUCCESS, payload: data.message || 'Customer updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
    }
  });

  // Mutation for deleting customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/entries/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete customer');
      }
      return response.data;
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_SUCCESS, payload: data.message || 'Customer deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
    }
  });

  return {
    customers,
    isLoading,
    error,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: (id, customerData) => updateCustomerMutation.mutate({ id, customerData }),
    deleteCustomer: deleteCustomerMutation.mutate
  };
};

export default useCustomerAPI;
