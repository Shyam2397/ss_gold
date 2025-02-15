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
    date: (formData.date || '').trim(),
    time: (formData.time || '').trim(),
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
