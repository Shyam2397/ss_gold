import { formatDateForDisplay, formatTimeForDisplay } from './validation';
import logo from '../../../assets/logo.png';

export const printData = (data) => {
  // Create a new window with larger dimensions
  const printWindow = window.open('', '_blank', 'width=900,height=600,left=100,top=100');
  
  // Create the content
  const content = `
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>SS GOLD Print Layout</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap');
        
        @page {
          size: A4 portrait;
          margin: 0;
          size: 210mm 297mm; /* A4 dimensions in mm */
          margin: 0;
          padding: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          font-size: 10pt;
          color: #111;
          box-sizing: border-box;
          width: 210mm;
          height: 99mm;
          background: #fff;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .container {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid transparent;
          padding: 2mm 6mm;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #FFD700;
          padding: 0 41px;
        
        }
        
        .logo {
          display: flex;
          align-items: center;
          font-weight: bold;
          font-size: 40pt;
          color: #c09823;
          user-select: none;
          white-space: nowrap;
        }
        .logo span {
          margin-top: 6px;
        }
        .company-info {
          text-align: left;
          font-weight: 600;
          font-size: 10pt;
          user-select: none;
          white-space: nowrap;
        }
        
        .company-info p:first-child {
          color: #FF0000;
          font-weight: 600;
          font-size: 16pt;
          margin-bottom: 0;
        }
        
        /*#4CBB17 - Kelly Green,#008000 - Green*/
        
        .company-info p:nth-child(2),
        .company-info p:nth-child(3) {
          color: #32CD32;
          font-weight: 600;
          font-size: 9pt;
          margin: 0;
          user-select: text;
        }

        /* MAIN INFO ROW */
        .main-info {
          display: grid;
          grid-template-columns: repeat(4, max-content 8px auto 16px);
          gap: 1px 12px;
          font-weight: 600;
          font-size: 9.5pt;
          margin-bottom: 2px;
          user-select: text;
          align-items: center;
          padding: 0 42px;
        }
        
        .main-info > div {
          display: contents;
        }
        
        .main-info label {
          font-weight: 600;
          user-select: text;
          justify-self: start;
          text-align: left;
          padding-left: 13px;
        }
        
        .main-info .sep {
          justify-self: start;
          color: #333;
        }
        
        .main-info span.value {
          font-weight: 600;
          justify-self: start;
        }

        /*#4CBB17 - Kelly Green,#008000 - Green*/

        /* GOLD INFO BAR */
        .gold-info-bar {
          background-color: #32CD32;
          color: yellow;
          font-weight: 900;
          font-size: 13pt;
          border-radius: 3px;
          border-top: 3px solid #FFD700;
          border-bottom: 3px solid #FFD700;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
          align-items: center;
          user-select: text;
          margin-bottom: 4px;
          padding: 8px 50px;
        }

        /* ELEMENTS TABLE */
        .elements-table {
          display: grid;
          grid-template-columns: repeat(4, max-content 8px auto 16px);
          gap: 6px 12px;
          font-size: 9.5pt;
          font-weight: 600;
          color: #222;
          margin-bottom: 4px;
          user-select: text;
          padding: 0 53px;
        }
        
        .elements-table .label {
          justify-self: start;
          text-align: left;
        }

        .elements-table .colon {
          justify-self: start;
          color: #333;
        }
        
        .elements-table .value {
          justify-self: center;
          font-weight: 600;
          font-size: 10pt;
        }

        /* REMARKS AUTHORIZED */
        .remarks-authorized {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: left;
          font-weight: 600;
          font-size: 9pt;
          user-select: none;
          padding: 2px 53px;
          border-bottom: 2px solid #FFD700;
        }
        
        .remarks-authorized div:nth-child(2) {
          color: #ff0000;
          text-transform: capitalize;
        }

        /* FOOTER MESSAGE */
        .footer-message {
          font-family: 'Allura', cursive;
          font-size: 14pt;
          font-weight: 600;
          text-align: center;
          margin-top: 2px;
          user-select: none;
          color: #222;
          
        }
      </style>
    </head>
    <body>
      <div class="container" role="document" aria-label="SS Gold certificate layout">
        <header class="header">
          <div class="logo" aria-label="SS Gold Logo">
            <img src="${logo}" alt="SS GOLD Logo" style="height: 78px;" />
            <span style="background: linear-gradient(90deg,rgba(214, 164, 6, 1) 0%, rgba(255, 215, 0, 1) 50%, rgba(214, 164, 6, 1) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent;">SS GOLD</span>
          </div>
          <div class="company-info" aria-label="Company details: Computer X-ray Testing, 59 Main Bazaar, Nilakottai 624208, Phone number 8903225544">
            <p>Computer X-ray Testing</p>
            <p>59, Main Bazaar, Nilakottai - 624 208</p>
            <p>Ph.No : 8903225544</p>
          </div>
        </header>

        <section class="main-info" aria-label="Basic certificate information">
          <div>
            <label for="tokenNo">Token No</label><span class="sep">:</span><span id="tokenNo" class="value">${data.tokenNo || data.tokenno || '-'}</span>
            <div></div><div></div><div></div><div></div><div></div>
            <label for="date">Date</label><span class="sep">:</span><span id="date" class="value">${formatDateForDisplay(data.date)}</span>
            <div></div><div></div><div></div><div></div><div></div>
            <label for="name">Name</label><span class="sep">:</span><span id="name" class="value">${data.name || '-'}</span>
            <div></div><div></div><div></div><div></div><div></div>
            <label for="time">Time</label><span class="sep">:</span><span id="time" class="value">${formatTimeForDisplay(data.time)}</span>
            <div></div><div></div><div></div><div></div><div></div>
            <label for="sample">Sample</label><span class="sep">:</span><span id="sample" class="value">${data.sample || '-'}</span>
            <div></div><div></div><div></div><div></div><div></div>
            <label for="weight">Weight</label><span class="sep">:</span><span id="weight" class="value">${data.weight ? parseFloat(data.weight).toFixed(3) + ' g' : '-'}</span>
            <div></div><div></div><div></div><div></div><div></div>
          </div>
        </section>

        <section class="gold-info-bar" aria-label="Gold fineness and karat details">
          <span>GOLD FINENESS %</span>
          <span>${data.gold_fineness ? data.gold_fineness.replace('%', '') : '-'}</span>
          <span>KARAT Ct</span>
          <span>${data.karat ? data.karat + ' K' : '-'}</span>
        </section>

        <section class="elements-table" aria-label="Elemental composition values">
          <div class="label">Silver</div><div class="colon">:</div><div class="value">${data.silver && parseFloat(data.silver) !== 0 ? parseFloat(data.silver).toFixed(2) : '-'}</div><div></div>
          <div class="label">Copper</div><div class="colon">:</div><div class="value">${data.copper && parseFloat(data.copper) !== 0 ? parseFloat(data.copper).toFixed(2) : '-'}</div><div></div>
          <div class="label">Zinc</div><div class="colon">:</div><div class="value">${data.zinc && parseFloat(data.zinc) !== 0 ? parseFloat(data.zinc).toFixed(2) : '-'}</div><div></div>
          <div class="label">Cadmium</div><div class="colon">:</div><div class="value">${data.cadmium && parseFloat(data.cadmium) !== 0 ? parseFloat(data.cadmium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Osmium</div><div class="colon">:</div><div class="value">${data.osmium && parseFloat(data.osmium) !== 0 ? parseFloat(data.osmium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Titanium</div><div class="colon">:</div><div class="value">${data.titanium && parseFloat(data.titanium) !== 0 ? parseFloat(data.titanium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Rhenium</div><div class="colon">:</div><div class="value">${data.rhenium && parseFloat(data.rhenium) !== 0 ? parseFloat(data.rhenium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Indium</div><div class="colon">:</div><div class="value">${data.indium && parseFloat(data.indium) !== 0 ? parseFloat(data.indium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Nickel</div><div class="colon">:</div><div class="value">${data.nickel && parseFloat(data.nickel) !== 0 ? parseFloat(data.nickel).toFixed(2) : '-'}</div><div></div>
          <div class="label">Tungsten</div><div class="colon">:</div><div class="value">${data.tungsten && parseFloat(data.tungsten) !== 0 ? parseFloat(data.tungsten).toFixed(2) : '-'}</div><div></div>
          <div class="label">Iridium</div><div class="colon">:</div><div class="value">${data.iridium && parseFloat(data.iridium) !== 0 ? parseFloat(data.iridium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Ruthenium</div><div class="colon">:</div><div class="value">${data.ruthenium && parseFloat(data.ruthenium) !== 0 ? parseFloat(data.ruthenium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Rhodium</div><div class="colon">:</div><div class="value">${data.rhodium && parseFloat(data.rhodium) !== 0 ? parseFloat(data.rhodium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Palladium</div><div class="colon">:</div><div class="value">${data.palladium && parseFloat(data.palladium) !== 0 ? parseFloat(data.palladium).toFixed(2) : '-'}</div><div></div>
          <div class="label">Platinum</div><div class="colon">:</div><div class="value">${data.platinum && parseFloat(data.platinum) !== 0 ? parseFloat(data.platinum).toFixed(2) : '-'}</div><div></div>
          <div class="label">Others</div><div class="colon">:</div><div class="value">${data.others && parseFloat(data.others) !== 0 ? parseFloat(data.others).toFixed(2) : '-'}</div><div></div>
        </section>

        <section class="remarks-authorized" aria-label="Remarks and authorization">
          <div>REMARKS</div>
          <div>${data.remarks ? data.remarks.charAt(0).toUpperCase() + data.remarks.slice(1) : '-'}</div>
          <div>Authorized By</div>
          <div>SS GOLD</div>
        </section>

        <footer class="footer-message" aria-label="Thank you message">
          Thank You .... Visit Again....
        </footer>
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
