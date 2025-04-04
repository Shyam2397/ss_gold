import { requiredFields } from '../constants/initialState';

export const validateForm = (formData, setError, isEditing = false) => {
  // For updates, we don't need to validate tokenNo as it comes from the URL
  const fieldsToValidate = isEditing 
    ? requiredFields.filter(field => field !== 'tokenNo')
    : requiredFields;

  // Check required fields
  for (const field of fieldsToValidate) {
    if (!formData[field]) {
      setError(`${field.replace(/_/g, ' ')} is required`);
      return false;
    }
  }

  // Validate weight is a number
  if (isNaN(parseFloat(formData.weight))) {
    setError('Weight must be a valid number');
    return false;
  }

  // Validate numeric fields
  const numericFields = [
    'highest',
    'average',
    'gold_fineness',
    'karat',
    'silver',
    'copper',
    'zinc',
    'cadmium',
    'nickel',
    'tungsten',
    'iridium',
    'ruthenium',
    'osmium',
    'rhodium',
    'rhenium',
    'indium',
    'titanium',
    'palladium',
    'platinum',
  ];

  for (const field of numericFields) {
    if (formData[field] && isNaN(parseFloat(formData[field]))) {
      setError(`${field.replace('_', ' ')} must be a valid number`);
      return false;
    }
  }

  return true;
};

export const processFormData = (formData) => {
  const processed = {
    tokenNo: (formData.tokenNo || formData.tokenno || '').trim(),
    // Pass date directly without any manipulation
    date: formData.date,
    time: formatTimeForInput(formData.time || '').trim(),
    name: (formData.name || '').trim(),
    weight: formData.weight ? parseFloat(formData.weight) : 0,
    sample: (formData.sample || '').trim(),
    highest: formData.highest ? parseFloat(formData.highest) : 0,
    average: formData.average ? parseFloat(formData.average) : 0,
    gold_fineness: formData.gold_fineness ? parseFloat(formData.gold_fineness) : 0,
    karat: formData.karat ? parseFloat(formData.karat) : 0,
    silver: formData.silver ? parseFloat(formData.silver) : 0,
    copper: formData.copper ? parseFloat(formData.copper) : 0,
    zinc: formData.zinc ? parseFloat(formData.zinc) : 0,
    cadmium: formData.cadmium ? parseFloat(formData.cadmium) : 0,
    nickel: formData.nickel ? parseFloat(formData.nickel) : 0,
    tungsten: formData.tungsten ? parseFloat(formData.tungsten) : 0,
    iridium: formData.iridium ? parseFloat(formData.iridium) : 0,
    ruthenium: formData.ruthenium ? parseFloat(formData.ruthenium) : 0,
    osmium: formData.osmium ? parseFloat(formData.osmium) : 0,
    rhodium: formData.rhodium ? parseFloat(formData.rhodium) : 0,
    rhenium: formData.rhenium ? parseFloat(formData.rhenium) : 0,
    indium: formData.indium ? parseFloat(formData.indium) : 0,
    titanium: formData.titanium ? parseFloat(formData.titanium) : 0,
    palladium: formData.palladium ? parseFloat(formData.palladium) : 0,
    platinum: formData.platinum ? parseFloat(formData.platinum) : 0,
    others: (formData.others || '').trim(),
    remarks: (formData.remarks || '').trim(),
    code: (formData.code || '').trim(),
    phoneNumber: (formData.phoneNumber || '').trim(),
  };

  // Convert any NaN values to 0 for numeric fields
  const numericFields = [
    'weight', 'highest', 'average', 'gold_fineness', 'karat',
    'silver', 'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
    'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
    'indium', 'titanium', 'palladium', 'platinum'
  ];

  numericFields.forEach(field => {
    if (isNaN(processed[field])) {
      processed[field] = 0;
    }
  });

  return processed;
};

// Date formatting utilities
export const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  
  // Create date in local timezone
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Adjust for timezone to get correct local date
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatTimeForDisplay = (timeStr) => {
  if (!timeStr) return '';
  
  // Extract hours and minutes
  let hours = 0;
  let minutes = 0;
  
  if (timeStr.includes('T')) {
    // Handle ISO datetime string
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      hours = date.getHours();
      minutes = date.getMinutes();
    }
  } else {
    // Handle HH:mm or HH:mm:ss format
    const [h, m] = timeStr.split(':');
    hours = parseInt(h);
    minutes = parseInt(m);
  }

  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12

  // Format the time
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  
  // Create date in local timezone
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Adjust for timezone to get correct local date
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTimeForInput = (timeStr) => {
  if (!timeStr) return '';
  
  // If it's already in HH:mm format, convert to 24-hour for input
  if (/^\d{1,2}:\d{2}\s?(?:AM|PM)$/i.test(timeStr)) {
    const [time, period] = timeStr.split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // If it's in HH:mm:ss format, remove seconds
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr.substring(0, 5);
  }
  
  return timeStr;
};
