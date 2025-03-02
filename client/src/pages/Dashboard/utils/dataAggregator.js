export const aggregateData = (data, period) => {
  if (!data || !data.length) return [];

  switch (period) {
    case 'weekly':
      return data.reduce((acc, curr) => {
        const date = new Date(curr.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        const existingWeek = acc.find(item => item.date === weekKey);
        
        if (existingWeek) {
          existingWeek.value += curr.value;
        } else {
          acc.push({ date: weekKey, value: curr.value });
        }
        return acc;
      }, []);

    case 'monthly':
      return data.reduce((acc, curr) => {
        const date = new Date(curr.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existingMonth = acc.find(item => item.date === monthKey);
        
        if (existingMonth) {
          existingMonth.value += curr.value;
        } else {
          acc.push({ date: monthKey, value: curr.value });
        }
        return acc;
      }, []);

    case 'yearly':
      return data.reduce((acc, curr) => {
        const date = new Date(curr.date);
        const yearKey = date.getFullYear().toString();
        const existingYear = acc.find(item => item.date === yearKey);
        
        if (existingYear) {
          existingYear.value += curr.value;
        } else {
          acc.push({ date: yearKey, value: curr.value });
        }
        return acc;
      }, []);

    default: // daily
      return data;
  }
};

export const formatDateLabel = (value, period) => {
  switch (period) {
    case 'weekly':
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'monthly':
      return value.split('-')[1] + '/' + value.split('-')[0];
    case 'yearly':
      return value;
    default:
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export const formatTooltipLabel = (value, period) => {
  switch (period) {
    case 'weekly':
      return `Week of ${new Date(value).toLocaleDateString()}`;
    case 'monthly':
      return `${new Date(value + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    case 'yearly':
      return `Year ${value}`;
    default:
      return new Date(value).toLocaleDateString();
  }
};
