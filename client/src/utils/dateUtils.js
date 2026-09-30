import { format, parseISO, isValid, parse } from 'date-fns';

// The API hands back dates as `TO_CHAR(date, 'YYYY-MM-DD')`, so ISO has to be
// tested before the generic "contains a dash" branch - otherwise "2026-09-30"
// is parsed as dd-MM-yyyy and silently becomes an Invalid Date.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]|$)/;
const DMY_DATE = /^\d{1,2}-\d{1,2}-\d{4}$/;
const SLASH_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

const MAX_CACHE_ENTRIES = 500;
const dateFormatCache = new Map();

// Bounded so a long-lived session cannot grow the cache without limit.
const readCache = (key) => (dateFormatCache.has(key) ? dateFormatCache.get(key) : undefined);

const writeCache = (key, value) => {
  if (dateFormatCache.size >= MAX_CACHE_ENTRIES) {
    dateFormatCache.clear();
  }
  dateFormatCache.set(key, value);
  return value;
};

const toDate = (value) => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return isValid(fromNumber) ? fromNumber : null;
  }
  if (typeof value !== 'string') return null;

  // parseISO reads a date-only ISO string as *local* midnight, so the calendar
  // day survives the round trip. `new Date(str)` would read it as UTC and shift
  // the date by a day in every timezone behind UTC.
  if (ISO_DATE.test(value)) {
    const iso = parseISO(value);
    return isValid(iso) ? iso : null;
  }
  if (DMY_DATE.test(value)) {
    const dmy = parse(value, 'dd-MM-yyyy', new Date());
    return isValid(dmy) ? dmy : null;
  }
  if (SLASH_DATE.test(value)) {
    const dmySlash = parse(value, 'dd/MM/yyyy', new Date());
    return isValid(dmySlash) ? dmySlash : null;
  }

  // Last resort: let date-fns try the string, then the native parser.
  try {
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  } catch {
    // fall through
  }
  const native = new Date(value);
  return isValid(native) ? native : null;
};

export const parseDate = (dateStr) => {
  if (!dateStr) return null;

  const cacheKey = `${dateStr instanceof Date ? dateStr.getTime() : dateStr}`;
  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  const parsed = toDate(dateStr);
  if (!parsed) {
    console.error('Error parsing date:', dateStr);
    return null;
  }
  return writeCache(cacheKey, parsed);
};

export const formatDate = (date, formatStr = 'dd-MM-yyyy') => {
  // Accepts a Date, a timestamp, or a raw string. Passing a string straight to
  // date-fns `format` throws, which is what previously blanked the date field
  // when a token was loaded for editing.
  const parsed = toDate(date);
  if (!parsed) return '';
  try {
    return format(parsed, formatStr);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};
