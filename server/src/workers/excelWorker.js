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
        return isNaN(date.getTime()) ? dateString : 
            `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    } catch (error) {
        return dateString;
    }
};

// Listen for messages from the main thread
parentPort.on('message', async ({ type, data, filePath }) => {
    try {
        switch (type) {
            case 'READ':
                const workbook = XLSX.readFile(filePath);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                parentPort.postMessage({ 
                    type: 'READ_SUCCESS', 
                    data: jsonData.map(row => ({
                        ...row,
                        date: formatDate(row.date)
                    }))
                });
                break;

            case 'WRITE':
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, 'SkinTests');
                XLSX.writeFile(wb, filePath);
                parentPort.postMessage({ type: 'WRITE_SUCCESS' });
                break;

            default:
                throw new Error('Unknown operation type');
        }
    } catch (error) {
        parentPort.postMessage({ type: 'ERROR', error: error.message });
    }
});
