/* eslint-disable no-restricted-globals */

// Helper function to prepare sparkline data for rendering
const prepareSparklineData = (data) => {
  try {
    if (!data || !Array.isArray(data)) {
      return { error: 'Invalid data format' };
    }

    // Normalize the data for better visualization
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // If all values are the same, return flat line data
    if (range === 0) {
      return data.map(item => ({
        ...item,
        normalizedValue: 0.5 // Middle of the chart
      }));
    }

    // Normalize values between 0 and 1 for better visualization
    const normalizedData = data.map(item => ({
      ...item,
      normalizedValue: (item.value - min) / range
    }));

    return normalizedData;
  } catch (error) {
    return { error: error.message };
  }
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const result = prepareSparklineData(event.data);
  self.postMessage(result);
});