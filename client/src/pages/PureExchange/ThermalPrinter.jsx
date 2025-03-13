import React from 'react';
import { FiPrinter } from 'react-icons/fi';

const ThermalPrinter = ({ tableData }) => {
  const printContent = () => {
    const printWindow = window.open('', '', 'width=1200,height=800');
    
    // Format the current date and time
    const firstRow = tableData[0] || {};
    
    // Set up the print window styles for 80mm thermal printer
    printWindow.document.write(`
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Arial', sans-serif;
              width: 80mm;
              padding: 3mm;
              margin: 0;
              font-size: 12px;
            }
            .center {
              text-align: center;
            }
            .header {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .info-row span:last-child {
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 2px 0;
            }
            th {
              text-align: center;
              padding: 3px 0;
              border-bottom: 1px dotted #ccc;
              font-size: 13px;
            }
            td {
              text-align: right;
              padding: 3px 0;
              border-bottom: 1px dotted #ccc;
              font-size: 13px;
            }
            .token {
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 5px;
              font-style: italic;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 2px 0;
            }
          </style>
        </head>
        <body>
          <div class="center">
            << ROUGH ESTIMATE >>
          </div>
          <div class="info-row">
            <span>${firstRow.date || ''}</span>
            <span>${firstRow.time || ''}</span>
          </div>
          <div class="header">
            ${firstRow.name || ''}
          </div>
          <div class="divider"></div>
          <table>
            <tr>
              <th>TokenNo</th>
              <th>Weight</th>
              <th>ExGold</th>
              <th>Pure</th>
            </tr>
            ${tableData.map((row) => {
              const weight = parseFloat(row.weight);
              const exGold = parseFloat(row.exGold);
              const adjustedWeight = (weight - 0.010).toFixed(3);
              const pure = ((weight - 0.010) * exGold / 100).toFixed(3);
              
              return `
                <tr>
                  <td class="token">${row.tokenNo}</td>
                  <td>${adjustedWeight}</td>
                  <td>${exGold.toFixed(2)}</td>
                  <td>${pure}</td>
                </tr>
              `;
            }).join('')}
          </table>
          <div class="divider"></div>
          <div class="info-row">
            <span>Total Pure</span>
            <span>${(tableData.reduce((total, row) => {
              const weight = parseFloat(row.weight);
              const exGold = parseFloat(row.exGold);
              return total + ((weight - 0.010) * exGold / 100);
            }, 0).toFixed(3))}</span>
          </div>
          <div class="info-row">
            <span>Issued (Bar-Ft-999)</span>
            <span>${(tableData.reduce((total, row) => {
              const weight = parseFloat(row.weight);
              const exGold = parseFloat(row.exGold);
              return total + ((weight - 0.010) * exGold / 100);
            }, 0).toFixed(2)) + '0'}</span>
          </div>
          <div class="info-row">
            <span>Balance</span>
            <span>Nil</span>
          </div>
          <div class="divider"></div>
          <div class="footer">
            Thank You ... Visit Again ...
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a small delay to ensure styles are loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <button
      onClick={printContent}
      disabled={!tableData || tableData.length === 0}
      className="px-2 py-1 border border-amber-300 text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px]"
    >
      <FiPrinter className="w-3.5 h-3.5" />
      <span>Print</span>
    </button>
  );
};

export default ThermalPrinter;
