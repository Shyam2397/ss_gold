import { metalFields } from '../constants/initialState';

export const calculateSum = (data) => {
  return metalFields.reduce((acc, key) => {
    const value = parseFloat(data[key]);
    return acc + (isNaN(value) ? 0 : value);
  }, 0);
};

export const calculateKarat = (goldFineness) => {
  const value = parseFloat(goldFineness);
  return !isNaN(value) ? (value / 4.1667).toFixed(2) : '';
};
