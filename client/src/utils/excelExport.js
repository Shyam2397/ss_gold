import ExcelJS from 'exceljs';

export const exportToExcel = async (data, sheetName, fileName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Get headers from the first data item
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => item[header]);
    worksheet.addRow(row);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(
      15,
      ...worksheet.getColumn(column.number).values
        .map(v => String(v || '').length)
    );
  });

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};
