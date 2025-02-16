import { formatDateForDisplay, formatTimeForDisplay } from './validation';

export const printData = (data) => {
  // Create a new window
  const printWindow = window.open('', '_blank');
  
  // Create the content
  const content = `
    <html>
      <head>
        <title>Print - SS GOLD</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @media print {
            @page {
              size: 210mm 99mm;
              margin: 0;
            }
            body {
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 210mm; background-color: white; height: 99mm;">
          <div style="text-align: center; font-family: Poppins; padding: 0; margin: 0; height: 27mm; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <h1 style="font-size: 55px; font-weight: bold; margin: 0px; background: linear-gradient(90deg, rgba(224,170,62,1) 0%, rgba(255,215,0,1) 67%, rgba(224,170,62,1) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                SS GOLD
              </h1>
            </div>
            <div style="display: flex; flex-flow: column; align-items: start;">
              <div style="margin: 0; padding: 0; font-weight: 700; font-size: 22px; color: red;">
                Computer X-ray Testing
              </div>
              <div style="font-weight: 600; font-size: 13px; color: lightgreen;">
                59, Main Bazaar, Nilakottai - 624208
              </div>
              <div style="font-weight: 600; font-size: 13px; color: lightgreen;">
                Ph.No : 8903225544
              </div>
            </div>
          </div>
          <hr style="border-top: 3px solid #D3B04D; margin: 0;" />
          <div style="display: grid; grid-template-columns: repeat(10,1fr); grid-template-rows: repeat(3,1fr); margin: 0; font-family: Poppins; color: black; font-weight: 500;">
            <div style="grid-column: 1/3;">Token No :</div>
            <div style="grid-column: 3/6;">${data.tokenNo || data.tokenno}</div>
            <div style="grid-column: 6/8;">Date :</div>
            <div style="grid-column: 8/11;">${formatDateForDisplay(data.date)}</div>
            <div style="grid-column: 1/3;">Name :</div>
            <div style="grid-column: 3/6;">${data.name}</div>
            <div style="grid-column: 6/8;">Time :</div>
            <div style="grid-column: 8/11;">${formatTimeForDisplay(data.time)}</div>
            <div style="grid-column: 1/3;">Sample :</div>
            <div style="grid-column: 3/6;">${data.sample}</div>
            <div style="grid-column: 6/8;">Weight :</div>
            <div style="grid-column: 8/11;">${parseFloat(data.weight).toFixed(3)} g</div>
          </div>
          <hr style="border-top: 3px solid #D3B04D; margin: 0;" />
          <div style="margin: 0; height: 10mm; background: red; display: grid; grid-template-columns: repeat(10,1fr); align-content: center; color: #FFD700; font-weight: bolder;">
            <div style="grid-column: 1/4;">GOLD FINENESS %</div>
            <div style="grid-column: 4/6;">${data.gold_fineness}%</div>
            <div style="grid-column: 6/8;">KARACT Ct</div>
            <div style="grid-column: 8;">${data.karat}K</div>
          </div>
          <hr style="border-top: 3px solid #D3B04D; margin: 0;" />
          <div style="margin: 0; display: grid; grid-template-columns: repeat(10,1fr); grid-template-rows: repeat(5,1fr); font-style: normal; height: 29mm; font-size: 14px; color: black; font-weight: 500;">
            <div style="grid-column: 1/3;">Silver :</div>
            <div style="grid-column: 3;">01</div>
            <div>Nickel :</div>
            <div>02</div>
            <div>Osmium :</div>
            <div>03</div>
            <div>Titanium :</div>
            <div>04</div>
            <div style="grid-column: 1/3;">Copper :</div>
            <div>05</div>
            <div>Tungsten :</div>
            <div>06</div>
            <div>Rhodium :</div>
            <div>07</div>
            <div>Palladium :</div>
            <div>08</div>
            <div style="grid-column: 1/3;">Zinc</div>
            <div>09</div>
            <div>Irudium</div>
            <div>10</div>
            <div>Rhenium</div>
            <div>11</div>
            <div>Platinum</div>
            <div>12</div>
            <div style="grid-column: 1/3;">Cadmium</div>
            <div>13</div>
            <div>Ruthenium</div>
            <div>14</div>
            <div>Indium</div>
            <div>15</div>
            <div>Others</div>
            <div>16</div>
            <div style="grid-column: 1/3;">REMARKS</div>
            <div style="grid-column: 3/5;">${data.remarks || '-'}</div>
            <div style="grid-column: 5/8;">Authorized By</div>
            <div style="grid-column: 8/11;">SS GOLD</div>
          </div>
          <hr style="border-top: 3px solid #D3B04D; margin: 0;" />
          <div style="text-align: center; font-size: 14px; color: black; font-weight: 500;">
            Thank You.... Visit Again....
          </div>
        </div>
      </body>
    </html>
  `;

  // Write the content to the window
  printWindow.document.write(content);
  printWindow.document.close();

  // Print after everything is loaded
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};
