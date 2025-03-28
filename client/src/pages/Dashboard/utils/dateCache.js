// Create a shared date cache utility
export const dateCache = new Map();

export const parseDate = (dateStr) => {
  if (!dateCache.has(dateStr)) {
    dateCache.set(dateStr, new Date(dateStr.split('-').reverse().join('-')));
  }
  return dateCache.get(dateStr);
};
