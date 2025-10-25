import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entryService from '../../../services/entryService';

const useCustomerAPI = (dispatch, ActionTypes) => {
  const queryClient = useQueryClient();

  // Query for fetching customers
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'], // Already correct
    queryFn: async () => {
      try {
        return await entryService.getEntries();
      } catch (err) {
        throw new Error(err.message || 'Error fetching customers');
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
      try {
        return await entryService.createEntry(customerData);
      } catch (err) {
        throw new Error(err.message || 'Failed to add customer');
      }
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Customer added successfully!' });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Already correct
    },
    onError: (err) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
    }
  });

  // Mutation for updating customer
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, customerData }) => {
      try {
        return await entryService.updateEntry(id, customerData);
      } catch (err) {
        throw new Error(err.message || 'Failed to update customer');
      }
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Customer updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Already correct
    },
    onError: (err) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
    }
  });

  // Mutation for deleting customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await entryService.deleteEntry(id);
      } catch (err) {
        throw new Error(err.message || 'Failed to delete customer');
      }
    },
    onSuccess: (data) => {
      dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Customer deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Already correct
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