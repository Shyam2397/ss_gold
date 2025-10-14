// ExcelJS will be dynamically imported when needed
let exceljsPromise = null;
let isExcelJSLoading = false;

const getExcelJS = async () => {
  if (exceljsPromise) {
    return exceljsPromise;
  }

  if (isExcelJSLoading) {
    // If ExcelJS is already being loaded, wait for it
    return new Promise((resolve) => {
      const check = () => {
        if (exceljsPromise) {
          resolve(exceljsPromise);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  isExcelJSLoading = true;
  try {
    exceljsPromise = import(/* webpackChunkName: "exceljs" */ 'exceljs')
      .then(module => module.default || module);
    return await exceljsPromise;
  } catch (error) {
    console.error('Failed to load ExcelJS:', error);
    exceljsPromise = null;
    isExcelJSLoading = false;
    throw error;
  }
};

const formatValue = (value, header) => {
  if (value === null || value === undefined) return '';
  
  const headerLower = header.toLowerCase();

  // Handle isPaid or Is Paid status
  if (headerLower.includes('paid')) {
    return value === true || value === 1 || value === 'true' || value === '1' ? 'Paid' : 'Not Paid';
  }

  // Handle time format - return actual time object for Excel
  if (headerLower.includes('time') && value) {
    try {
      // Parse the time string (HH:MM format)
      const [hours, minutes] = value.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        // Create a time object that Excel can recognize
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    } catch (e) {
      console.warn('Error formatting time:', e);
    }
    return value;
  }

  // Handle date format - return actual date object for Excel
  if (headerLower.includes('date') && value) {
    try {
      const date = new Date(value);
      if (!isNaN(date)) {
        return date;
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
    }
    return value;
  }

  // Handle amount format - return numeric value for Excel
  if (headerLower.includes('amount') && !isNaN(value)) {
    return parseFloat(value);
  }

  // Handle weight format - return numeric value for Excel
  if (headerLower.includes('weight') && !isNaN(value)) {
    return parseFloat(value);
  }

  // Handle other numeric fields - return numeric value for Excel
  if (!isNaN(value)) {
    return parseFloat(value);
  }

  return String(value || '');
};

// Format data without loading ExcelJS
const prepareDataForExport = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error('No data available for export');
  }
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => formatValue(item[header], header))
  );
  
  return { headers, rows };
};

export const exportToExcel = async (data, sheetName, fileName) => {
  try {
    // Load ExcelJS only when needed
    const ExcelJS = await getExcelJS();
    const { headers } = prepareDataForExport(data);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers row
    const headerRow = worksheet.addRow(headers);
    
    // Style only the actual header cells, not the entire row
    headerRow.eachCell((cell, colNumber) => {
      // Only apply styling if there's a header in this column
      if (colNumber <= headers.length) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3B04D' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
    
    // Add data rows
    data.forEach((item) => {
      const values = headers.map(header => formatValue(item[header], header));
      const row = worksheet.addRow(values);
      
      // Style data cells
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1] || '';
        const headerLower = header.toLowerCase();
        
        // Format numbers
        if (typeof cell.value === 'number' || !isNaN(parseFloat(cell.value))) {
          const numericValue = typeof cell.value === 'number' ? cell.value : parseFloat(cell.value);
          
          // Handle weights (3 decimal places)
          if (headerLower.includes('weight')) {
            cell.numFmt = '0.000';
            cell.value = numericValue;
          } 
          // Handle exgold and other numeric fields (2 decimal places)
          else if (headerLower.includes('exgold') || 
                  headerLower.includes('highest') || 
                  headerLower.includes('average') ||
                  headerLower.includes('fineness') ||
                  headerLower.includes('amount')) {
            cell.numFmt = '0.00';
            cell.value = numericValue;
          } else {
            // For other numeric values, keep them as numbers without specific formatting
            cell.value = numericValue;
          }
        }
        // Handle date formatting
        else if (headerLower.includes('date') && cell.value instanceof Date) {
          cell.numFmt = 'DD-MM-YYYY';
        }
        // Handle time formatting
        else if (headerLower.includes('time') && cell.value instanceof Date) {
          cell.numFmt = 'HH:MM AM/PM';
        }
        
        // Set alignment
        if (headerLower.includes('weight') || 
            headerLower.includes('exgold') || 
            headerLower.includes('highest') || 
            headerLower.includes('average') ||
            headerLower.includes('fineness') ||
            headerLower.includes('amount')) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (headerLower.includes('date') || 
                  headerLower.includes('time')) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
        
        // Style isPaid cells
        if (headerLower.includes('paid')) {
          const isPaid = cell.value === 'Paid';
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isPaid ? 'FFE8F5E9' : 'FFFBE9E7' }
          };
          cell.font = {
            color: { argb: isPaid ? 'FF2E7D32' : 'FFD32F2F' },
            bold: true
          };
        }
        
        // Add borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE8D5B9' } },
          left: { style: 'thin', color: { argb: 'FFE8D5B9' } },
          bottom: { style: 'thin', color: { argb: 'FFE8D5B9' } },
          right: { style: 'thin', color: { argb: 'FFE8D5B9' } }
        };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      const maxLength = Math.max(
        headers[index].length,
        ...worksheet.getColumn(index + 1).values
          .filter(Boolean)
          .map(v => String(v).length)
      );
      column.width = Math.max(12, Math.min(maxLength + 2, 30));
    });

    // Generate buffer and create download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Clear the promise on error to allow retry
    if (error.message && error.message.includes('Loading chunk')) {
      exceljsPromise = null;
    }
    throw error;
  }
};