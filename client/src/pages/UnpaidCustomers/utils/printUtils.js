// Import the logo
// The silent-print path hands this HTML to the Electron main process, which loads
// it via a `data:` URL. That document has no base path, so a normal
// "/assets/logo.png" reference resolves to nothing and the statement header prints
// blank - with no error, since a missing image is not reported. The logo therefore
// has to be inlined as a data URI.
//
// A production build does that via `assetsInlineLimit` in vite.config.js, but the
// dev server does not, and main.js points an unpackaged app at
// http://localhost:3000. `getStatementLogo` below converts it at runtime as well,
// exactly like the Token receipt does.
import loadImage from 'blueimp-load-image';
import logoPath from '../../../assets/logo.png';

// Preload images to ensure they're loaded before printing
export const preloadImages = (imagePaths) => {
  return Promise.all(
    imagePaths.map(path => 
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ path, img });
        img.onerror = resolve; // Resolve even if image fails to load
        img.src = path;
      })
    )
  );
};

export const convertImageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    loadImage(
      imagePath,
      (canvas) => {
        resolve(canvas.toDataURL('image/png'));
      },
      {
        maxWidth: 1000,
        maxHeight: 1000,
        canvas: true,
        orientation: true
      }
    );
  });
};

// A logo failure must never block the receipt, so fall back to the raw asset
// path - which still works for the browser-dialog print. `null` = not resolved
// yet, `false` = unavailable.
let printLogoCache = null;
const getStatementLogo = async () => {
  if (printLogoCache !== null) return printLogoCache || null;

  try {
    await preloadImages([logoPath]);
    printLogoCache = (await convertImageToBase64(logoPath)) || false;
  } catch (err) {
    console.error('Logo could not be prepared, printing without it:', err);
    printLogoCache = false;
  }
  return printLogoCache || logoPath;
};

// Format date for display as dd-mm-yy
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Handle different date string formats
  let date;
  if (typeof dateString === 'string') {
    // Try parsing ISO date string
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } 
    // Handle dd-mm-yyyy or dd/mm/yyyy formats
    else if (dateString.includes('-') || dateString.includes('/')) {
      const [day, month, year] = dateString.split(/[-/]/);
      // Note: Month is 0-indexed in JavaScript Date
      date = new Date(year, month - 1, day);
    }
    // Handle timestamp
    else if (!isNaN(dateString)) {
      date = new Date(parseInt(dateString));
    } else {
      // Fallback to default parsing
      date = new Date(dateString);
    }
  } else if (dateString instanceof Date) {
    date = dateString;
  } else {
    return '';
  }

  // Validate the date
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString);
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

// Abbreviate test names
const formatTestName = (testName) => {
  if (!testName) return '';
  const lowerTest = testName.toLowerCase();
  if (lowerTest.includes('skin')) return 'skin Test';
  if (lowerTest.includes('photo')) return 'photo Test';
  return testName;
};

// Generate print content for customer statement
export const generateCustomerStatementContent = (customerData, logo = logoPath) => {
  const { customerName, customerPhone, code, totalAmount, entries = [] } = customerData;
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate rows for each entry
  const entryRows = entries.map(entry => `
    <tr>
      <td class="token">${entry.tokenNo || ''}</td>
      <td class="date">${formatDate(entry.date)}</td>
      <td class="test">${formatTestName(entry.test) || ''}</td>
      <td class="amount">${entry.amount ? `₹${entry.amount}` : ''}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Statement - SS GOLD</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0;
            padding: 0 10mm 0 0;
          }
          body { 
            font-family: Arial, sans-serif;
            width: 72mm; /* Standard width for 80mm printers */
            margin: 0 auto;
            padding: 1mm;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { 
            text-align: center; 
            margin: 0 0 2px 0;
            border-bottom: 1px solid black; 
            padding-bottom: 2px; 
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo {
            width: 30px;
            height: 30px;
            margin-right: 5px;
            object-fit: contain;
            filter: grayscale(100%) contrast(120%) brightness(0%);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin-top: -4px;
          }
          .header-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .header-title {
            font-size: 20px;
            margin: 0 0 2px 0;
            line-height: 1.1;
            vertical-align: middle;
          }
          .header-subtitle {
            font-size: 12px;
            margin: 0;
            line-height: 1.2;
          }
          .header-subtitle:nth-child(2) {
            font-size: 14px;
            font-weight: bold;
          }
          .customer-info {
            border-bottom: 1px dashed #000;
            font-size: 12px;
            font-weight: bold;
          }
          .info-row {
            display: flex;
            margin: 1mm 0;
          }
          .secondary-info {
            display: flex;
            justify-content: space-between;
            width: 100%;
            } 
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 12px;
            table-layout: fixed;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 3px 0;
            font-weight: bold;
          }
          td {
            padding: 3px 0;
            vertical-align: top;
          }
          .token { 
            width: 15%;
          }
          .date { 
            width: 20%;
          }
          .test { 
            width: 25%;
          }
          .amount { 
            width: 20%;
            text-align: right;
            white-space: nowrap;
          }
          .total-row {
            font-weight: bold;
            border-top: 1px solid #000;
            margin-top: 2px;
            padding-top: 3px;
            text-align: right;
            font-size: 12px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 3px;
            padding-top: 3px;
            border-top: 1px dashed #000;
            font-style: italic;
            font-size: 10px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
       <div class="header">
          <div class="header-text">
            <div class="logo-container">
                <img src="${logo}" alt="SS GOLD Logo" class="logo"/>
                <h1 class="header-title">SS GOLD</h1>
            </div>
            <p class="header-subtitle">Computer X-ray Testing</p>
            <p class="header-subtitle">59, Main Bazaar, Nilakottai - 624208</p>
            <p class="header-subtitle">Ph.No: 8903225544</p>
          </div>        
        </div>
        
        <div class="customer-info">
          <div class="info-row">
            <span>${customerName || 'N/A'}</span>
          </div>
          <div class="info-row">
            <div class="secondary-info">
              <span>${code || 'N/A'}</span>
              <span>${customerPhone || 'N/A'}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Date</th>
              <th>Test</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${entryRows}
          </tbody>
        </table>

        <div class="total-row">
          Total Outstanding:  <span class="total-amount">${formatCurrency(totalAmount)}</span>
        </div>

        <div class="footer">
          Thank you for your business
        </div>
      </body>
    </html>
  `;
};

// Helper function to format time to AM/PM
const formatTimeToAMPM = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Browser-dialog fallback. Still used when running outside Electron, and as the
// safety net when the silent print fails, so the operator always gets a receipt.
const printViaDialog = (printContent) => {
  const printWindow = window.open('', '', 'width=800,height=400');
  if (!printWindow) {
    throw new Error('Popup was blocked. Please allow popups for this site.');
  }

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Print after a short delay to ensure content is loaded
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

/**
 * Prints the 80mm customer statement.
 *
 * Prefers the Electron thermal printer so no dialog appears and no popup blocker
 * is involved. Falls back to the browser dialog if the silent print fails, so a
 * printer error never leaves the operator without a way to get the statement.
 *
 * @returns {Promise<{ confirmed: boolean, reason?: string }>} `confirmed` is true
 *   only when the spooler took the job; the dialog path cannot be confirmed
 *   because the operator may cancel it.
 */
export const printCustomerStatement = async (customerData) => {
  // Inline the logo before generating the markup - a `data:` URL print cannot
  // resolve an asset path, so an un-inlined logo silently prints a blank header.
  const logo = await getStatementLogo();

  const printContent = generateCustomerStatementContent(customerData, logo);

  const isElectronEnv = window.electron && window.electron.isElectron;

  if (isElectronEnv) {
    try {
      const result = await window.electron.silentPrintCustomerStatement(printContent);
      if (!result.success) {
        throw new Error(result.error || 'Silent print failed');
      }
      return { confirmed: true };
    } catch (error) {
      // Do not surface this - fall through so a printer hiccup still produces a
      // receipt via the dialog.
      console.error('Customer statement silent print failed, using dialog:', error);
    }
  }

  printViaDialog(printContent);
  return { confirmed: false, reason: 'dialog' };
};
