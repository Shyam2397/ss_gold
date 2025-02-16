import ExcelJS from 'exceljs';

const formatValue = (value, header) => {
  if (value === null || value === undefined) return '';
  
  // Convert header to lowercase for comparison
  const headerLower = header.toLowerCase();

  // Handle isPaid or Is Paid status
  if (headerLower.includes('paid')) {
    return value === true || value === 1 || value === 'true' || value === '1' ? 'Paid' : 'Not Paid';
  }

  // Handle time format
  if (headerLower.includes('time') && value) {
    try {
      const [hours, minutes] = value.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    } catch (e) {
      console.warn('Error formatting time:', e);
      return value;
    }
  }

  // Handle date format
  if (headerLower.includes('date') && value) {
    try {
      const date = new Date(value);
      if (!isNaN(date)) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
      return value;
    }
  }

  // Handle amount format
  if (headerLower.includes('amount') && !isNaN(value)) {
    return Number(value).toFixed(2);
  }

  // Handle weight format
  if (headerLower.includes('weight') && !isNaN(value)) {
    return Number(value).toFixed(2);
  }

  return String(value || '');
};

export const exportToExcel = async (data, sheetName, fileName) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Invalid or empty data for export:', data);
    throw new Error('No data available for export');
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Get headers and format them
    const headers = Object.keys(data[0]);
    
    // Add headers row
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'FFDD845A' } },
        { position: 1, color: { argb: 'FFD3B04D' } }
      ]
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add data rows
    data.forEach((item, index) => {
      const values = headers.map(header => formatValue(item[header], header));
      const row = worksheet.addRow(values);
      
      // Style data cells
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        
        // Set alignment based on data type
        if (header.toLowerCase().includes('amount') || 
            header.toLowerCase().includes('weight')) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (header.toLowerCase().includes('date') || 
                  header.toLowerCase().includes('time') ||
                  header.toLowerCase().includes('paid')) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
        
        // Style isPaid cells
        if (header.toLowerCase().includes('paid')) {
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
    console.error('Error during export:', error);
    throw error;
  }
};
