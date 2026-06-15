import { metalFields } from '../constants/initialState';

export const calculateSum = (data) => {
  return metalFields.reduce((acc, key) => {
    const value = parseFloat(data[key]);
    return acc + (isNaN(value) ? 0 : value);
  }, 0);
};

export const calculateKarat = (goldFineness, silverValue) => {
  const goldValue = parseFloat(goldFineness) || 0;
  const silver = parseFloat(silverValue) || 0;
  
  // If gold is zero but silver has value, calculate karat based on silver
  const value = goldValue === 0 && silver > 0 ? silver : goldValue;
  
  return value > 0 ? (value / 4.1667).toFixed(2) : '';
};
