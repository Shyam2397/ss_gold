// Centralized date parsing for the Dashboard.
// Supports the formats used across the app:
//   - ISO: "YYYY-MM-DD" / full ISO strings (incl. time)
//   - "DD/MM/YYYY"
//   - "DD-MM-YYYY"
//   - Date instances
// An optional separate time string ("HH:MM[:SS]") can be applied.

const MAX_CACHE_SIZE = 500;
const dateCache = new Map();

const applyTime = (date, timeStr) => {
  if (!timeStr || isNaN(date.getTime())) return date;
  const [hours, minutes, seconds] = String(timeStr).split(':').map(n => parseInt(n, 10));
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  return date;
};

const buildDate = (dateStr, timeStr) => {
  if (dateStr === null || dateStr === undefined || dateStr === '') {
    return new Date(NaN);
  }

  if (dateStr instanceof Date) {
    const copy = new Date(dateStr.getTime());
    return applyTime(copy, timeStr);
  }

  const str = String(dateStr).trim();
  let date;

  if (str.includes('/')) {
    // DD/MM/YYYY
    const [datePart, timePart] = str.split(/[ T]/);
    const [day, month, year] = datePart.split('/').map(Number);
    date = new Date(year, month - 1, day);
    if (timePart) applyTime(date, timePart);
  } else if (str.includes('-')) {
    const segments = str.split(/[ T]/)[0].split('-');
    if (segments.length === 3 && segments[0].length === 4) {
      // ISO YYYY-MM-DD (native parsing also handles the time component)
      date = new Date(str);
    } else if (segments.length === 3) {
      // DD-MM-YYYY
      const [day, month, year] = segments.map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(str);
    }
  } else {
    date = new Date(str);
  }

  return applyTime(date, timeStr);
};

export function parseDate(dateStr, timeStr) {
  const key = `${dateStr instanceof Date ? dateStr.getTime() : dateStr}|${timeStr || ''}`;
  if (dateCache.has(key)) return dateCache.get(key);

  if (dateCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }

  const parsed = buildDate(dateStr, timeStr);
  dateCache.set(key, parsed);
  return parsed;
}

export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export function clearDateCache() {
  dateCache.clear();
}

export default { parseDate, isValidDate, clearDateCache };
