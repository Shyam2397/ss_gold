const dateFormatCache = new Map();

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Check cache first
  if (dateFormatCache.has(dateStr)) {
    return dateFormatCache.get(dateStr);
  }

  try {
    let date;
    if (typeof dateStr === 'string') {
      // Handle DD-MM-YYYY format
      if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        date = new Date(year, month - 1, day);
      }
      // Handle MM/DD/YYYY format
      else if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        date = new Date(year, month - 1, day);
      }
      // Handle ISO format
      else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Cache the result
    dateFormatCache.set(dateStr, date);
    return date;
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return null;
  }
};

export const aggregateData = (data, period) => {
  if (!Array.isArray(data) || !data.length) return [];

  const aggregatedMap = new Map();
  const now = new Date();

  try {
    data.forEach(item => {
      const date = parseDate(item.date);
      if (!date) return;

      let key;
      switch (period) {
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, { date: key, value: 0 });
      }
      aggregatedMap.get(key).value += Number(item.value) || 0;
    });

    return Array.from(aggregatedMap.values())
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  } catch (error) {
    console.error('Error aggregating data:', error);
    return [];
  }
};

export const formatDateLabel = (value, period) => {
  if (!value) return '';
  
  try {
    const date = parseDate(value);
    if (!date) return value;

    switch (period) {
      case 'yearly':
        return date.getFullYear();
      case 'monthly':
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
      case 'weekly':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      default:
        return date.toLocaleString('default', { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.error('Error formatting date label:', error);
    return value;
  }
};

export const formatTooltipLabel = (value, period) => {
  if (!value) return '';
  
  try {
    const date = parseDate(value);
    if (!date) return value;

    switch (period) {
      case 'yearly':
        return `Year ${date.getFullYear()}`;
      case 'monthly':
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'weekly':
        return `Week of ${date.toLocaleDateString()}`;
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting tooltip label:', error);
    return value;
  }
};

export default {
  aggregateData,
  formatDateLabel,
  formatTooltipLabel
};
