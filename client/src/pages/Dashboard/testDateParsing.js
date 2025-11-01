// Test date parsing function
const dateCache = new Map();

// Helper function to parse dates with caching and support for multiple formats
const parseDate = (dateStr) => {
  // Return early if already cached
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr);
  }
  
  let parsedDate;
  
  try {
    // Handle different date formats
    if (typeof dateStr === 'string') {
      if (dateStr.includes('-')) {
        // Check if it's already in ISO format (YYYY-MM-DD)
        const isoParts = dateStr.split('-');
        if (isoParts.length === 3 && isoParts[0].length === 4) {
          // Already in correct format (YYYY-MM-DD)
          parsedDate = new Date(dateStr);
        } else {
          // Assuming format is DD-MM-YYYY
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            // Convert DD-MM-YYYY to MM-DD-YYYY for proper Date parsing
            parsedDate = new Date(`${parts[1]}-${parts[0]}-${parts[2]}`);
          } else {
            // Fallback for other formats
            parsedDate = new Date(dateStr);
          }
        }
      } else if (dateStr.includes('/')) {
        // Handle DD/MM/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Convert DD/MM/YYYY to MM/DD/YYYY for proper Date parsing
          parsedDate = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
        } else {
          // Fallback for other formats
          parsedDate = new Date(dateStr);
        }
      } else {
        // Handle other formats
        parsedDate = new Date(dateStr);
      }
    } else {
      // Handle non-string dates
      parsedDate = new Date(dateStr);
    }
    
    // Validate date
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    // Fallback to current date if parsing fails
    parsedDate = new Date();
  }
  
  // Cache the result
  dateCache.set(dateStr, parsedDate);
  return parsedDate;
};

// Test cases
const testCases = [
  '2023-12-01', // ISO format
  '01-12-2023', // DD-MM-YYYY format
  '01/12/2023', // DD/MM/YYYY format
  '2023-12-01T10:30:00Z', // ISO with time
];

console.log('Testing date parsing function:');
testCases.forEach(testCase => {
  const result = parseDate(testCase);
  console.log(`${testCase} -> ${result.toISOString()}`);
});

// Test date range filtering
const today = new Date();
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);
const fourteenDaysAgo = new Date(today);
fourteenDaysAgo.setDate(today.getDate() - 14);

console.log('\nDate range filtering test:');
console.log('Today:', today.toISOString());
console.log('7 days ago:', sevenDaysAgo.toISOString());
console.log('14 days ago:', fourteenDaysAgo.toISOString());

const testDates = [
  '2023-12-01',
  '01-12-2023',
  '01/12/2023',
];

testDates.forEach(dateStr => {
  const parsedDate = parseDate(dateStr);
  const inCurrentPeriod = parsedDate >= sevenDaysAgo && parsedDate <= today;
  const inPreviousPeriod = parsedDate >= fourteenDaysAgo && parsedDate < sevenDaysAgo;
  
  console.log(`${dateStr} (${parsedDate.toISOString()}):`);
  console.log(`  In current period (last 7 days): ${inCurrentPeriod}`);
  console.log(`  In previous period (8-14 days ago): ${inPreviousPeriod}`);
});