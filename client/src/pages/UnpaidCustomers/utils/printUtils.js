// Import the logo
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

// Format date for display as dd-mm-yy
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
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
export const generateCustomerStatementContent = (customerData) => {
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
            padding: 0 8px;
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
                <img src="${logoPath}" alt="SS GOLD Logo" class="logo"/>
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

// Function to handle the print action
export const printCustomerStatement = async (customerData) => {
  try {
    // Preload the logo image
    const imagesToPreload = [logoPath];
    await preloadImages(imagesToPreload);
    
    // Generate the print content
    const printContent = generateCustomerStatementContent(customerData);
    
    // Open the print window
    const printWindow = window.open('', '', 'width=800,height=400');
    if (!printWindow) {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    }
    
    // Write the content and close the document
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  } catch (error) {
    console.error('Print error:', error);
    throw error; // Re-throw to be caught by the component
  }
};
