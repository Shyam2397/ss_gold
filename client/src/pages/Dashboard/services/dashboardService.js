import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export const fetchTokens = async () => {
  const { data } = await api.get('/tokens');
  return data;
};

export const fetchExpenses = async () => {
  const { data } = await api.get('/api/expenses');
  return data;
};

export const fetchEntries = async () => {
  const { data } = await api.get('/entries');
  return data;
};

export const fetchExchanges = async () => {
  const { data } = await api.get('/pure-exchange');
  return data.data || [];
};
