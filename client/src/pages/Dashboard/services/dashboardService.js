import { getApi } from '../../../services/api';

export const fetchTokens = async () => {
  const api = await getApi();
  const { data } = await api.get('/tokens');
  return data;
};

export const fetchExpenses = async () => {
  const api = await getApi();
  const { data } = await api.get('/api/expenses');
  return data;
};

export const fetchEntries = async () => {
  const api = await getApi();
  const { data } = await api.get('/entries');
  return data;
};

export const fetchExchanges = async () => {
  const api = await getApi();
  const { data } = await api.get('/pure-exchange');
  return data.data || [];
};
