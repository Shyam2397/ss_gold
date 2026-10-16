import logo from '../../../assets/logo.png';
import { ARROW_W, ARROW_H, ARROW_VIEWBOX, ARROW_COLOR, ARROW_PATH } from './arrowGeometry';

export const printPhotoData = (formData) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700,left=100,top=100');

  // Red pointer arrows overlaid on the sample photo (positions are fractions
  // of the photo area, matching the on-screen preview).
  const arrowList = Array.isArray(formData.arrows) ? formData.arrows : [];
  const arrowsHtml = formData.photoUrl
    ? arrowList
        .map(
          (a) => `
        <div style="position:absolute;left:${a.x * 100}%;top:${a.y * 100}%;width:${ARROW_W}px;height:${ARROW_H}px;transform:translate(-50%,-50%) rotate(${a.angle}deg);z-index:5;pointer-events:none;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;">
          <svg width="${ARROW_W}" height="${ARROW_H}" viewBox="${ARROW_VIEWBOX}" style="shape-rendering:geometricPrecision;">
            <path d="${ARROW_PATH}" fill="${ARROW_COLOR}" shape-rendering="geometricPrecision"/>
          </svg>
        </div>`
        )
        .join('')
    : '';

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>SS GOLD - Print</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap" rel="stylesheet">
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap');
          @page {
            size: 6in 4in;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ensure high quality rendering for print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html {
            width: 6in;
            height: 4in;
            margin: 0;
            padding: 0;
          }
          body {
            width: 6in;
            height: 4in;
            margin: 0;
            padding: 12.4px;
            background: white;
            font-family: 'Poppins', sans-serif;
            box-sizing: border-box;
            overflow: hidden;
            page-break-after: avoid;
            break-after: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .photo-printarea {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: inset 0 0 0 1.4px #FFD700;
            box-sizing: border-box;
            padding: 4px; /* Match UI p-[4px] */
          }
          .photo-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Optimize images for high-quality print rendering */
          .photo-wrapper img {
            image-rendering: auto;
            image-rendering: high-quality;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .left-wrapper {
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            padding-left: 4px;
          }
          .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            height: 65px;
            padding: 0;
            margin: 0;
          }
          .header img {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-top: -10px;
            margin-left: -10px;
          }
          .header h1 {
            font-size: 42px;
            font-weight: bold;
            margin-left: 8px;
            margin:0;
            margin-top: -5px;
            background: linear-gradient(90deg, rgba(214,164,6,1) 0%, rgba(255,215,0,1) 50%, rgba(214,164,6,1) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
          .header h2 {
            font-size: 15px;
            font-weight: bold;
            color: #dc2626;
            margin: -15px 0 0;
            text-align: right;
          }
          .address {
            font-size: 11px;
            font-weight: 500;
            color: #00B050;
            margin: 0;
          }
          .address p {
            margin: 0;
          }

          .form-fields {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            padding-top: 6px;
          }
          .form-fields .f-field {
            display: flex;
            align-items: center;
            margin: 0;
          }
          .form-fields .f-field span {
              font-size: 11px;
              font-weight: 600;
              color: #1D6194;
              width: 60px;
              margin:0;
          }
          .f-field span:nth-child(2) {
              width: 2px;
              margin-left:5px;
              padding-right:8px;
          }

          .field{
            display: flex;
            align-items: center;
            margin: 0;
            font-size: 11px;
            font-weight: 600;
            color: #1D6194;
            padding-top: 6px;
          }
          .field span{
            width: 60px;
          }
          .field span:nth-child(2) {
            width:2px ;
            margin-left:5px;
            padding-right:8px;
          }
          .field span:nth-child(3) {
            width: auto;
          }

          .results-table {
            margin-top: 2px;
            border: 2px solid #dc2626;
            border-collapse: collapse;
            width: 264px;
          }
          .results-table th {
            background: #FFD700;
            color: #dc2626;
            font-size: 16px;
            font-weight: bold;
            padding: 6px;
            border: 1px solid #dc2626;
            text-align: center;
          }
          .results-table td {
            background: #FFD700;
            color: #dc2626;
            font-size: 16px;
            font-weight: bold;
            padding: 6px;
            border: 1px solid #dc2626;
            text-align: center;
          }
          
          .additional-results{
            margin-top : 2px; 
          }
          .additional-columns{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            padding-top: 2px;
          }
          .remark {
            color: #dc2626;
            font-weight: bold;
          }
          .right-wrapper {
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 5px;
            box-sizing: border-box;
            background-color: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .right-wrapper img {
            flex-grow: 1;
            max-width: 100%;
            max-height: calc(100% - 20px);
            object-fit: contain;
            background-color: white;
          }
          
          /* Pure white background for no-image state */
          .right-wrapper .no-image {
            width: 100%;
            height: 100%;
            background-color: white !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .footer {
            color: #dc2626;
            font-weight: 500;
            font-size: 10px;
            text-align: center;
            margin-top: auto;
            height: 20px; /* Match UI footer space calc(100%-20px) */
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* High-DPI print optimization - smooth, high-quality rescaling */
          @media print and (min-resolution: 300dpi) {
            .right-wrapper img {
              image-rendering: auto !important;
              image-rendering: high-quality !important;
              -ms-interpolation-mode: bicubic !important;
              filter: none !important;
              transform: translateZ(0) !important;
            }
          }
          
          /* Keep smooth (non-pixelated) rescaling in all browsers */
          @media print {
            .right-wrapper img {
              image-rendering: auto !important;
              image-rendering: high-quality !important;
              -ms-interpolation-mode: bicubic !important;
              backface-visibility: hidden !important;
              -webkit-backface-visibility: hidden !important;
              transform: translate3d(0,0,0) !important;
              will-change: auto !important;
            }
            
            /* Ensure pure white background when no image */
            .right-wrapper {
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="photo-printarea">
            <div class="photo-wrapper">
              <div class="left-wrapper">
                <div class="header">
                  <img src="${logo}" alt="Logo" />
                  <div>
                    <h1>SS GOLD</h1>
                    <h2>Computer X-ray Testing</h2>
                  </div>
                </div>

                <div class="address">
                  <p>59, Main Bazaar, Nilakottai - 624 208</p>
                  <p>Ph.No - 8903225544</p>
                </div>

                <div class="form-fields">
                  <div class="f-field"><span>Token No</span> <span> : </span> <span>${formData.tokenNo || 'N/A'}</span></div>
                  <div class="f-field"><span>Date</span> <span> : </span> <span>${formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  }).replace(/\//g, '-') : 'N/A'}</span></div>
                </div>
                <div class="field"><span>Name</span> <span> : </span> <span>${formData.name || 'N/A'}</span></div>
                <div class="field"><span>Sample</span> <span> : </span> <span>${formData.sample || 'N/A'}</span></div>
                <div class="field"><span>Weight</span> <span> : </span> <span>${formData.weight != null ? parseFloat(formData.weight).toFixed(3) : '-'}</span></div>

                <table class="results-table">
                <thead>
                  <tr><th>GOLD %</th><th>KARAT</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${formData.goldFineness || '0.00'}</td>
                    <td>${formData.karat || '0.00'}</td>
                  </tr>
                </tbody>
              </table>

              <div class="additional-result">
                <div class="additional-columns">
                  <div class="field"><span>Silver</span> <span> : </span> <span>${formData.silver || '-'}</span></div>
                  <div></div>
                </div>
                <div class="additional-columns">
                  <div class="field"><span>Copper</span> <span> : </span> <span>${formData.copper || '-'}</span></div>
                  <div class="field"><span>Cadmium</span> <span> : </span> <span>${formData.cadmium || '-'}</span></div>
                </div>
                <div class="additional-columns">
                  <div class="field"><span>Zinc</span> <span> : </span> <span>${formData.zinc || '-'}</span></div>
                  <div class="field"><span>Remark</span> <span> : </span> <span class="remark">${formData.remarks || '-'}</span></div>
                </div>
              </div>

              </div>

              <div class="right-wrapper">
                <div style="
                  flex-grow: 1;
                  max-height: calc(100% - 20px);
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                ">
                  ${formData.photoUrl ? `
                    <div style="
                      position: relative;
                      width: 100%;
                      height: 100%;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      overflow: hidden;
                      background-color: white;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    ">
                      <img 
                        src="${formData.photoUrl}" 
                        alt="Uploaded Photo" 
                        style="
                          width: calc(100% * ${formData.photoScale || 1});
                          height: calc(100% * ${formData.photoScale || 1});
                          flex: 0 0 auto;
                          max-width: none;
                          max-height: none;
                          object-fit: contain;
                          image-rendering: auto;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                          color-adjust: exact !important;
                          background-color: white;
                          filter: contrast(1.1) saturate(1.1);
                        "
                      />
                      ${arrowsHtml}
                    </div>
                  ` : `
                    <div style="
                      width: 100%;
                      height: 100%;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      background-color: white;
                      border: none;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    ">
                      <!-- Pure white background when no image -->
                    </div>
                  `}
                </div>
                <div class="footer">Result are only for skin of the sample.</div>
              </div>
            </div>
        </div>
      </body>
    </html>
  `;

  // Write content to print window with error handling
  try {
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  } catch (error) {
    console.error('Error writing to print window:', error);
    // Fallback: Try alternative method
    try {
      printWindow.document.body.innerHTML = content.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      alert('Unable to open print dialog. Please try again.');
      printWindow.close();
      return;
    }
  }
  
  // Simplified print dialog management
  printWindow.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Print window loaded');
    }

    let printStarted = false;

    // Fonts can change the measured layout, so settle them before fitting/printing
    // - capped so a hung request can never block the print.
    const waitForFonts = () => {
      const ready = printWindow.document.fonts && printWindow.document.fonts.ready;
      if (!ready) return Promise.resolve();
      return Promise.race([
        ready.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
    };

    // Guarantee the whole card lands on one 6in x 4in page: if the content is
    // taller/wider than the sheet, scale it down to fit (never scale up).
    const fitToPage = () => {
      const area = printWindow.document.querySelector('.photo-printarea');
      if (!area) return;
      area.style.transform = '';
      area.style.transformOrigin = 'top left';
      const scale = Math.min(
        1,
        area.clientWidth / area.scrollWidth,
        area.clientHeight / area.scrollHeight
      );
      if (scale < 0.999) {
        area.style.transform = `scale(${scale})`;
      }
    };

    const prepareAndPrint = async () => {
      if (printStarted) return;
      printStarted = true;
      await waitForFonts();
      fitToPage();
      initiatePrint();
    };

    // Wait for images to load with simplified logic
    const images = printWindow.document.querySelectorAll('img');
    const totalImages = images.length;
    
    if (totalImages === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No images - printing immediately (pure white background)');
      }
      prepareAndPrint();
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Waiting for ${totalImages} images to load`);
      }
      
      let loadedCount = 0;
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            const onLoad = () => {
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
              resolve();
            };
            const onError = () => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Image failed to load - continuing with print');
              }
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
              resolve();
            };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
          }
        });
      });
      
      // Wait for all images with timeout fallback
      Promise.allSettled(imagePromises).then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('All images processed');
        }
        prepareAndPrint();
      });
      
      // Fallback timeout to prevent hanging
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Timeout reached - proceeding with print');
        }
        prepareAndPrint();
      }, 3000);
    }
    
    function initiatePrint() {
      try {
        // Force redraw and focus
        printWindow.document.body.offsetHeight;
        printWindow.focus();
        
        // Simple print trigger with minimal delay
        setTimeout(() => {
          printWindow.print();
          
          // Close window after print dialog
          setTimeout(() => {
            printWindow.close();
          }, 100);
        }, 100);
        
      } catch (error) {
        console.error('Error during printing:', error);
        printWindow.close();
      }
    }
  });
};
