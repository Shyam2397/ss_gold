import React from 'react';
import { FiPrinter } from 'react-icons/fi';

const ThermalPrinter = ({ tableData }) => {
  const printContent = () => {
    const printWindow = window.open('', '', 'width=800,height=400');
    
    // Format the current date and time
    const firstRow = tableData[0] || {};
    
    // Set up the print window styles for 80mm thermal printer
    printWindow.document.write(`
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap" rel="stylesheet">
      <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap');
            
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Poppins', sans-serif;
              width: 80mm;
              padding: 0 3mm;
              margin: 0;
              font-size: 13px;
              font-weight: 600;
            }
            .center {
              text-align: center;
              font-size: 14px;
              font-weight: 600;
            }
            .info-date {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 13px;
              font-weight: 600;
            }
            .header {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 15px;
            }
            .value {
              padding-right: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1px 0;
            }

            th {
              text-align: center;
              padding: 2px 0;
              border-bottom: 1px dashed #000;
              font-size: 14px;
            }
            td {
              text-align: center;
              padding: 2px 0;
              border-bottom: 1px dotted #ccc;
              font-size: 14px;
              font-weight: 600;
            }
            .token {
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 5px;
              font-family: 'Allura', cursive;
              font-size: 17px;
              font-weight: 600;
              font-style: normal;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 1px 0;
            }
          </style>
        </head>
        <body>
          <div class="center">
            << ROUGH ESTIMATE >>
          </div>
          <div class="info-date">
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
              const adjustedWeight = (weight).toFixed(3);
              const pure = ((weight) * exGold / 100).toFixed(3);
              
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
            <span class="value">${(tableData.reduce((total, row) => {
              const weight = parseFloat(row.weight);
              const exGold = parseFloat(row.exGold);
              return total + ((weight) * exGold / 100);
            }, 0).toFixed(3))}</span>
          </div>
          <div class="info-row">
            <span>Issued (Bar-Ft-999)</span>
            <span class="value">${(() => {
              const total = tableData.reduce((sum, row) => {
                const weight = parseFloat(row.weight);
                const exGold = parseFloat(row.exGold);
                return sum + ((weight) * exGold / 100);
              }, 0);
              
              // Custom rounding logic
              const rounded = Math.floor(total * 1000) / 1000; // Keep 3 decimal places
              const thirdDecimal = Math.floor(rounded * 1000) % 10;
              
              let result;
              if (thirdDecimal <= 6) {
                // Round down to 2 decimal places
                result = (Math.floor(rounded * 100) / 100).toFixed(2);
              } else {
                // Round up to 2 decimal places
                result = (Math.ceil(rounded * 100) / 100).toFixed(2);
              }
              // Add '0' at the end to ensure 2 decimal places are always shown
              return result + '0';
            })()}</span>
          </div>
          <div class="info-row">
            <span>Balance</span>
            <span class="value">Nil</span>
          </div>
          <div class="divider"></div>
          <div class="footer">
            Thank You .... Visit Again ....
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
