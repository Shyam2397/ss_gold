import { format, parseISO, isValid, parse } from 'date-fns';

const dateFormatCache = new Map();

export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  if (dateFormatCache.has(dateStr)) {
    return dateFormatCache.get(dateStr);
  }

  try {
    let date;
    if (typeof dateStr === 'string') {
      if (dateStr.includes('-')) {
        date = parse(dateStr, 'dd-MM-yyyy', new Date());
      } else if (dateStr.includes('/')) {
        date = parse(dateStr, 'dd/MM/yyyy', new Date());
      } else {
        date = parseISO(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }

    if (!isValid(date)) {
      throw new Error('Invalid date');
    }

    dateFormatCache.set(dateStr, date);
    return date;
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return null;
  }
};

export const formatDate = (date, formatStr = 'dd-MM-yyyy') => {
  try {
    return format(date, formatStr);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};
