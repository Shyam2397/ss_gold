import loadImage from 'blueimp-load-image';
import { formatDate } from '../../../utils/dateUtils';
import logoPath from '../../../assets/logo.png';

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

// The silent-print path hands this markup to the Electron main process, which
// loads it via a `data:` URL. That document has no base path, so a plain
// "/assets/logo.png" reference resolves to nothing and the logo is simply absent
// from the slip - with no error. A production build inlines the PNG via
// `assetsInlineLimit`, but the dev server does not and main.js points an
// unpackaged app at http://localhost:3000, so convert it at runtime too.
//
// A logo failure must never block printing, so fall back to the raw asset path.
// `null` = not resolved yet, `false` = unavailable.
let printLogoCache = null;
const getEstimateLogo = async () => {
    if (printLogoCache !== null) return printLogoCache || null;

    try {
        printLogoCache = (await convertImageToBase64(logoPath)) || false;
    } catch (err) {
        console.error('Logo could not be prepared, printing without it:', err);
        printLogoCache = false;
    }
    return printLogoCache || logoPath;
};

// Resolves the logo inside the builder rather than taking it as an argument, so
// no caller can accidentally hand it the un-inlined asset path.
export const buildPrintHtml = async (rows) => {
    const logo = await getEstimateLogo();

    const tableData = rows || [];
    // Rows carry the storage-format date (ISO), so render it day-first for the
    // customer. formatDate handles ISO and the legacy dd-MM-yyyy rows alike.
    const firstRow = tableData[0] || {};

    // Generate HTML content for 80mm thermal printer
    const htmlContent = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap" rel="stylesheet">
      <style>
            @page {
              size: 80mm auto;
              margin: 0 8mm 0 0;
            }
            body {
              font-family: 'Poppins', sans-serif;
              width: 80mm;
              /* top padding keeps the logo clear of the printer's non-printable
                 margin; @page has no top margin */
              padding: 1mm 3mm 0;
              margin: 0;
              font-size: 13px;
              font-weight: 600;
            }
            .center {
              text-align: center;
              font-size: 14px;
              font-weight: 600;
            }
            .logo {
              display: block;
              width: 26px;
              height: 26px;
              margin: 0 auto 1px;
              object-fit: contain;
              filter: grayscale(100%) contrast(120%) brightness(0%);
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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
            .tweight {
              padding-left: 25px;
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
          <img src="${logo}" alt="SS GOLD Logo" class="logo"/>
          <div class="center">
            << ROUGH ESTIMATE >>
          </div>
          <div class="info-date">
            <span>${formatDate(firstRow.date, 'dd-MM-yyyy')}</span>
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
              <th>Purity</th>
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
            <span>Weight</span>
            <span class="tweight">${(tableData.reduce((total, row) => {
              const weight = parseFloat(row.weight);
              return total + weight;
            }, 0).toFixed(3))}</span>
            <span>Pure</span>
            <span class="value">${(tableData.reduce((total, row) => {
              const weight = parseFloat(row.weight);
              const exGold = parseFloat(row.exGold);
              return total + ((weight) * exGold / 100);
            }, 0).toFixed(3))}</span>
          </div>
          <div class="info-row">
            <span>Issued (Bar-Ft-999)</span>
            <span class="value">${(() => {
              // Get the total pure value from the Total Pure field
              const totalPure = parseFloat(tableData.reduce((total, row) => {
                const weight = parseFloat(row.weight);
                const exGold = parseFloat(row.exGold);
                return total + ((weight) * exGold / 100);
              }, 0).toFixed(3));

              // Get the third decimal place (handle negative numbers)
              const thirdDecimal = Math.abs(Math.floor(totalPure * 1000) % 10);

              let result;
              if (thirdDecimal <= 6) {
                // Truncate to 2 decimal places
                result = Math.trunc(totalPure * 100) / 100;
              } else {
                // Round up to 2 decimal places
                result = Math.ceil(totalPure * 100) / 100;
              }

              return result.toFixed(2) + '0';
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
    `;

    return htmlContent;
};

// Opens the browser print dialog for the receipt.
//
// A popup blocker makes window.open return null, and the old code then blew up
// on `printWindow.document`, so the operator only ever saw
// "Cannot read properties of null (reading 'document')" - with no idea that the
// fix was to allow pop-ups.
const printViaDialog = (htmlContent) => {
    const printWindow = window.open('', '', 'width=800,height=400');

    if (!printWindow) {
        throw new Error('The print window was blocked by the browser. Allow pop-ups for this site, then print again.');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

// Returns { confirmed } rather than nothing, so the caller can tell the operator
// the truth. `confirmed: true` means the spooler accepted the job. The dialog
// path cannot be confirmed - window.print() only opens a dialog the operator may
// cancel - so it reports false instead of a success the app cannot vouch for.
export const printPureExchange = async (rows) => {
    const tableData = rows || [];
    if (tableData.length === 0) return { confirmed: false, reason: 'empty' };

    // The logo is inlined by buildPrintHtml - a `data:` URL print cannot resolve an
    // asset path, so an un-inlined logo is silently missing.
    const htmlContent = await buildPrintHtml(tableData);

    // Check if running in Electron environment
    const isElectronEnv = window.electron && window.electron.isElectron;

    if (isElectronEnv) {
      try {
        // Use silent printing via Electron
        const result = await window.electron.silentPrintPureExchange(htmlContent);
        if (!result.success) {
          throw new Error(result.error || 'Silent print failed');
        }
        return { confirmed: true };
      } catch (error) {
        console.error('Electron print error:', error);
        // Fallback to window.open if Electron print fails
        printViaDialog(htmlContent);
        return { confirmed: false, reason: 'dialog' };
      }
    }

    // Fallback for non-Electron environment
    printViaDialog(htmlContent);
    return { confirmed: false, reason: 'dialog' };
};
