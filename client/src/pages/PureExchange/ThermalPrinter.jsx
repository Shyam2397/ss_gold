import React from 'react';

const ThermalPrinter = ({ data }) => {
  const printContent = () => {
    const printWindow = window.open('', '', 'width=1200,height=800');
    
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
            th, td {
              text-align: left;
              padding: 3px 0;
              border-bottom: 1px dotted #ccc;
              font-size: 13px;
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
            <span>${data?.date[0]}</span>
            <span>${data?.time[0]}</span>
          </div>
          <div class="header">
            ${data?.name[0]}
          </div>
          <div class="divider"></div>
          <table>
            <tr>
              <th>TokenNo</th>
              <th>Weight</th>
              <th>ExGold</th>
              <th>Pure</th>
            </tr>
            ${data?.tokenNo.map((token, index) => {
              const weight = parseFloat(data.weight[index]);
              const exGold = parseFloat(data.exGold[index]);
              const adjustedWeight = (weight - 0.010).toFixed(3);
              const pure = ((weight - 0.010) * exGold / 100).toFixed(3);
              
              return `
                <tr>
                  <td>${token}</td>
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
            <span>${(data?.tokenNo.reduce((total, _, index) => {
              const weight = parseFloat(data.weight[index]);
              const exGold = parseFloat(data.exGold[index]);
              return total + ((weight - 0.010) * exGold / 100);
            }, 0).toFixed(2)) + '0'}</span>
          </div>
          <div class="info-row">
            <span>Issued (Bar-Ft-999)</span>
            <span>${(data?.tokenNo.reduce((total, _, index) => {
              const weight = parseFloat(data.weight[index]);
              const exGold = parseFloat(data.exGold[index]);
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
      style={{
        padding: '8px 16px',
        background: 'linear-gradient(4deg, rgba(34,195,123,1) 0%, rgba(88,253,45,1) 100%)',
        color: 'white', 
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        transition: 'background 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(4deg, rgba(88,253,45,1) 0%, rgba(34,195,123,1) 100%)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(4deg, rgba(34,195,123,1) 0%, rgba(88,253,45,1) 100%)'}
    >
      Print Receipt
    </button>
  );
};

export default ThermalPrinter;
