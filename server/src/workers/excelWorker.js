const { parentPort } = require('worker_threads');
const XLSX = require('xlsx');

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const [day, month, year] = dateString.split('-');
      if (day && month && year) {
        date = new Date(year, month - 1, day);
      }
    }
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  } catch (error) {
    return dateString;
  }
};

// Listen for messages from the main thread
parentPort.on('message', async (message) => {
  const { type, data, filePath } = message;

  try {
    switch (type) {
      case 'READ':
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const formattedData = jsonData.map(row => ({
          ...row,
          date: formatDate(row.date)
        }));
        parentPort.postMessage({ type: 'READ_SUCCESS', data: formattedData });
        break;

      case 'WRITE':
        const worksheet = XLSX.utils.json_to_sheet(data);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, 'Tokens');
        XLSX.writeFile(newWorkbook, filePath);
        parentPort.postMessage({ type: 'WRITE_SUCCESS' });
        break;

      default:
        throw new Error('Unknown operation type');
    }
  } catch (error) {
    parentPort.postMessage({ type: 'ERROR', error: error.message });
  }
});
