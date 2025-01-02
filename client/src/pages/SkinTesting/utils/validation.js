import { requiredFields } from '../constants/initialState';

export const validateForm = (formData, setError) => {
  // Check required fields
  for (const field of requiredFields) {
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
  return {
    tokenNo: formData.tokenNo.trim(),
    date: formData.date.trim(),
    time: formData.time.trim(),
    name: formData.name.trim(),
    weight: parseFloat(formData.weight) || 0,
    sample: formData.sample.trim(),
    highest: parseFloat(formData.highest) || 0,
    average: parseFloat(formData.average) || 0,
    gold_fineness: parseFloat(formData.gold_fineness) || 0,
    karat: parseFloat(formData.karat) || 0,
    silver: parseFloat(formData.silver) || 0,
    copper: parseFloat(formData.copper) || 0,
    zinc: parseFloat(formData.zinc) || 0,
    cadmium: parseFloat(formData.cadmium) || 0,
    nickel: parseFloat(formData.nickel) || 0,
    tungsten: parseFloat(formData.tungsten) || 0,
    iridium: parseFloat(formData.iridium) || 0,
    ruthenium: parseFloat(formData.ruthenium) || 0,
    osmium: parseFloat(formData.osmium) || 0,
    rhodium: parseFloat(formData.rhodium) || 0,
    rhenium: parseFloat(formData.rhenium) || 0,
    indium: parseFloat(formData.indium) || 0,
    titanium: parseFloat(formData.titanium) || 0,
    palladium: parseFloat(formData.palladium) || 0,
    platinum: parseFloat(formData.platinum) || 0,
    others: (formData.others || '').trim(),
    remarks: (formData.remarks || '').trim(),
    code: (formData.code || '').trim(),
    phoneNumber: (formData.phoneNumber || '').trim(),
  };
};
